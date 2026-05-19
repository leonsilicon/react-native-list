import NitroModules
import UIKit

class HybridNativeListLayout: HybridNativeListLayoutSpec {}

protocol NativeListLayoutProviding: AnyObject {
    func makeCollectionViewLayout(owner: HybridUiListView) -> UICollectionViewLayout
    func layoutSize(contentSize: CGSize) -> CGSize
}

class HybridNativeLinearListLayout: HybridNativeLinearListLayoutSpec, NativeListLayoutProviding {
    private var topInset: CGFloat = 16
    private var bottomInset: CGFloat = 16
    private var itemSpacing: CGFloat = 12

    func setConfig(config: NativeLinearListLayoutConfig) throws {
        topInset = CGFloat(config.topInset)
        bottomInset = CGFloat(config.bottomInset)
        itemSpacing = CGFloat(config.itemSpacing)
    }

    func makeCollectionViewLayout(owner: HybridUiListView) -> UICollectionViewLayout {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumLineSpacing = itemSpacing
        layout.minimumInteritemSpacing = 0
        layout.sectionInset = UIEdgeInsets(
            top: topInset,
            left: 0,
            bottom: bottomInset,
            right: 0
        )
        // FlowLayout owns the vertical offset bookkeeping; we only provide measured sizes.
        layout.estimatedItemSize = .zero
        return layout
    }

    func layoutSize(contentSize: CGSize) -> CGSize {
        let width = ceil(contentSize.width + HostCell.horizontalInset * 2)
        let height = ceil(contentSize.height + HostCell.verticalInset * 2)
        return CGSize(width: width, height: height)
    }

    func yOffsetForFirstItem() -> CGFloat {
        return topInset
    }

    func yOffsetAfterItem(currentOffset: CGFloat, itemHeight: CGFloat) -> CGFloat {
        return currentOffset + itemHeight + itemSpacing
    }

    func contentHeight(lastOffset: CGFloat, itemCount: Int) -> CGFloat {
        var height = lastOffset
        if itemCount > 0 {
            height -= itemSpacing
        }
        height += bottomInset
        return max(height, 0)
    }
}

final class LinearCollectionViewLayout: UICollectionViewLayout {
    weak var owner: HybridUiListView?
    private weak var linearLayout: HybridNativeLinearListLayout?
    private var itemSizes: [CGSize] = []
    private var itemYOffsets: [CGFloat] = []
    private var contentSize = CGSize.zero
    private var firstDirtyIndex: Int?
    private var prepareCount = 0
    private var layoutAttributesQueryCount = 0

    init(owner: HybridUiListView, layout: HybridNativeLinearListLayout) {
        self.owner = owner
        linearLayout = layout
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func markDirty(from index: Int) {
        let dirtyIndex = max(index, 0)
        guard let currentDirtyIndex = firstDirtyIndex else {
            firstDirtyIndex = dirtyIndex
            return
        }
        firstDirtyIndex = min(currentDirtyIndex, dirtyIndex)
    }

    override func prepare() {
        guard let collectionView, let owner, let linearLayout else {
            itemSizes = []
            itemYOffsets = []
            contentSize = .zero
            firstDirtyIndex = nil
            return
        }

        prepareCount += 1
        let itemCount = owner.collectionView(collectionView, numberOfItemsInSection: 0)
        let startTime = CACurrentMediaTime()
        let previousItemCount = itemSizes.count

        if previousItemCount != itemCount {
            itemSizes = Array(repeating: .zero, count: itemCount)
            itemYOffsets = Array(repeating: 0, count: itemCount)
            markDirty(from: 0)
        }

        let dirtyIndex = firstDirtyIndex ?? itemCount
        var recalculatedItems = 0

        if dirtyIndex < itemCount {
            // Keep prefix offsets instead of rebuilding 10k attributes on every measured-height update.
            var yOffset = linearLayout.yOffsetForFirstItem()
            if dirtyIndex > 0 {
                let previousIndex = dirtyIndex - 1
                let previousSize = itemSizes[previousIndex]
                yOffset = linearLayout.yOffsetAfterItem(
                    currentOffset: itemYOffsets[previousIndex],
                    itemHeight: previousSize.height
                )
            }

            for itemIndex in dirtyIndex..<itemCount {
                let itemSize = owner.layoutSizeForItem(at: itemIndex)
                itemSizes[itemIndex] = itemSize
                itemYOffsets[itemIndex] = yOffset
                yOffset = linearLayout.yOffsetAfterItem(
                    currentOffset: yOffset,
                    itemHeight: itemSize.height
                )
                recalculatedItems += 1
            }
        }

        let lastOffset: CGFloat
        if itemCount > 0 {
            let lastIndex = itemCount - 1
            let lastSize = itemSizes[lastIndex]
            lastOffset = linearLayout.yOffsetAfterItem(
                currentOffset: itemYOffsets[lastIndex],
                itemHeight: lastSize.height
            )
        } else {
            lastOffset = linearLayout.yOffsetForFirstItem()
        }

        let height = linearLayout.contentHeight(lastOffset: lastOffset, itemCount: itemCount)
        contentSize = CGSize(width: collectionView.bounds.width, height: height)
        firstDirtyIndex = nil

        let duration = (CACurrentMediaTime() - startTime) * 1000
        print(
            "[UserDebug] layout prepare count=\(prepareCount) " +
            "itemCount=\(itemCount) recalculated=\(recalculatedItems) " +
            "contentSize=\(contentSize.width)x\(contentSize.height) " +
            "durationMs=\(duration)"
        )
    }

    override var collectionViewContentSize: CGSize {
        return contentSize
    }

    override func layoutAttributesForElements(in rect: CGRect) -> [UICollectionViewLayoutAttributes]? {
        layoutAttributesQueryCount += 1
        let startTime = CACurrentMediaTime()

        var scannedAttributes = 0
        var visibleAttributes: [UICollectionViewLayoutAttributes] = []
        if let firstVisibleIndex = firstVisibleIndex(in: rect) {
            var itemIndex = firstVisibleIndex
            while itemIndex < itemSizes.count {
                let frame = frameForItem(at: itemIndex)
                if frame.minY > rect.maxY {
                    break
                }
                scannedAttributes += 1
                if frame.intersects(rect) {
                    let indexPath = IndexPath(item: itemIndex, section: 0)
                    let attributes = UICollectionViewLayoutAttributes(forCellWith: indexPath)
                    attributes.frame = frame
                    visibleAttributes.append(attributes)
                }
                itemIndex += 1
            }
        }

        let duration = (CACurrentMediaTime() - startTime) * 1000
        print(
            "[UserDebug] layout attributes query count=\(layoutAttributesQueryCount) " +
            "rect=\(rect.origin.y)..\(rect.maxY) scanned=\(scannedAttributes) " +
            "returned=\(visibleAttributes.count) durationMs=\(duration)"
        )
        return visibleAttributes
    }

    override func layoutAttributesForItem(at indexPath: IndexPath) -> UICollectionViewLayoutAttributes? {
        guard indexPath.item >= 0 && indexPath.item < itemSizes.count else {
            return nil
        }
        let attributes = UICollectionViewLayoutAttributes(forCellWith: indexPath)
        attributes.frame = frameForItem(at: indexPath.item)
        return attributes
    }

    override func shouldInvalidateLayout(forBoundsChange newBounds: CGRect) -> Bool {
        guard let collectionView else {
            return false
        }
        let shouldInvalidate = collectionView.bounds.width != newBounds.width
        if shouldInvalidate {
            markDirty(from: 0)
        }
        return shouldInvalidate
    }

    private func frameForItem(at index: Int) -> CGRect {
        let size = itemSizes[index]
        let yOffset = itemYOffsets[index]
        return CGRect(x: 0, y: yOffset, width: size.width, height: size.height)
    }

    private func firstVisibleIndex(in rect: CGRect) -> Int? {
        guard !itemSizes.isEmpty else {
            return nil
        }

        // Binary search skips the thousands of off-screen rows before the visible rect.
        var lowIndex = 0
        var highIndex = itemSizes.count - 1
        var result: Int?

        while lowIndex <= highIndex {
            let middleIndex = (lowIndex + highIndex) / 2
            let itemMaxY = itemYOffsets[middleIndex] + itemSizes[middleIndex].height
            if itemMaxY >= rect.minY {
                result = middleIndex
                highIndex = middleIndex - 1
            } else {
                lowIndex = middleIndex + 1
            }
        }

        return result
    }
}
