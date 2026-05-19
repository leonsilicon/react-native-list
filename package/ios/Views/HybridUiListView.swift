//
//  HybridUiListView.swift
//  ReactNativeList
//
//  Created by Hanno Gödecke on 14.02.26.
//

import DifferenceKit
import Foundation
import NitroModules
import UIKit

final class CollectionViewDataSourceProxy: NSObject, UICollectionViewDataSource {
    weak var owner: HybridUiListView?

    init(owner: HybridUiListView) {
        self.owner = owner
        super.init()
    }

    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return owner?.numberOfSections(in: collectionView) ?? 0
    }

    func collectionView(
        _ collectionView: UICollectionView,
        numberOfItemsInSection section: Int
    ) -> Int {
        return owner?.collectionView(collectionView, numberOfItemsInSection: section) ?? 0
    }

    func collectionView(
        _ collectionView: UICollectionView,
        cellForItemAt indexPath: IndexPath
    ) -> UICollectionViewCell {
        guard let owner else {
            return UICollectionViewCell()
        }
        return owner.collectionView(collectionView, cellForItemAt: indexPath)
    }
}

final class CollectionViewDelegateProxy: NSObject, UICollectionViewDelegateFlowLayout {
    weak var owner: HybridUiListView?

    init(owner: HybridUiListView) {
        self.owner = owner
        super.init()
    }

    func collectionView(
        _ collectionView: UICollectionView,
        layout collectionViewLayout: UICollectionViewLayout,
        sizeForItemAt indexPath: IndexPath
    ) -> CGSize {
        guard let owner else {
            return .zero
        }
        return owner.collectionView(
            collectionView,
            layout: collectionViewLayout,
            sizeForItemAt: indexPath
        )
    }
}

class HybridUiListView : HybridUiListViewSpec {
    let view: UIView

    private var collectionView: UICollectionView?
    private var collectionDataSourceProxy: CollectionViewDataSourceProxy?
    private var collectionDelegateProxy: CollectionViewDelegateProxy?
    private var dataSource: HybridNativeListDataSource?
    private var layoutProvider: NativeListLayoutProviding = HybridNativeLinearListLayout()
    private var registeredReuseIdentifiers = Set<String>()
    private var measuredContentSizeByItemKey: [String: CGSize] = [:]
    private var hasScheduledLayoutInvalidation = false
    private var flowLayoutSizeQueryCount = 0
    private let measuredSizeTolerance: CGFloat = 0.5

    private var createViewCallback: ((_ type: String) -> Double)?
    private var updateViewCallback: ((_ reactTag: Double, _ item: NativeListItem, _ index: Double) -> Bool)?

    override init() {
        view = UIView(frame: .zero)
        super.init()
    }

    func setListCallbacks(
        uiListModule: any HybridUiListModuleSpec,
        createView: @escaping (String) -> Double,
        updateView: @escaping (Double, NativeListItem, Double) -> Bool
    ) throws {
        createViewCallback = createView
        updateViewCallback = updateView
        runOnMain { [weak self] in
            self?.configureCollectionViewIfNeeded()
        }
    }

    func setDataSource(dataSource nextDataSource: any HybridNativeListDataSourceSpec) throws {
        guard let concreteDataSource = nextDataSource as? HybridNativeListDataSource else {
            throw RuntimeError.error(withMessage: "NativeListDataSource must be created by react-native-list.")
        }

        runOnMain { [weak self] in
            guard let self else { return }
            self.dataSource?.observer = nil
            self.dataSource = concreteDataSource
            concreteDataSource.observer = self
            self.configureCollectionViewIfNeeded()
            self.retainMeasuredContent(in: concreteDataSource)
            self.markLayoutDirty(from: 0)
            self.collectionView?.collectionViewLayout.invalidateLayout()
            self.collectionView?.reloadData()
        }
    }

    func setLayout(layout: any HybridNativeListLayoutSpec) throws {
        guard let nextLayout = layout as? NativeListLayoutProviding else {
            throw RuntimeError.error(withMessage: "NativeListLayout must provide a platform layout.")
        }

        runOnMain { [weak self] in
            guard let self else { return }
            layoutProvider = nextLayout
            configureCollectionViewIfNeeded()
            let collectionViewLayout = nextLayout.makeCollectionViewLayout(owner: self)
            collectionView?.setCollectionViewLayout(collectionViewLayout, animated: false)
        }
    }

    private func configureCollectionViewIfNeeded() {
        guard collectionView == nil else { return }

        let layout = layoutProvider.makeCollectionViewLayout(owner: self)
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .systemBackground
        collectionView.translatesAutoresizingMaskIntoConstraints = false

        view.backgroundColor = .clear
        view.addSubview(collectionView)
        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.topAnchor),
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            collectionView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        let dataSourceProxy = CollectionViewDataSourceProxy(owner: self)
        let delegateProxy = CollectionViewDelegateProxy(owner: self)
        collectionDataSourceProxy = dataSourceProxy
        collectionDelegateProxy = delegateProxy
        collectionView.dataSource = dataSourceProxy
        collectionView.delegate = delegateProxy
        self.collectionView = collectionView
    }

    private func makeView(type: String) throws -> (UIView, ReactTag) {
        guard let createViewCallback else {
            throw RuntimeError.error(withMessage: "Can only call makeView after setListCallbacks.")
        }

        let startTime = CACurrentMediaTime()
        print("[UserDebug] makeView start type=\(type)")
        let callbackStartTime = CACurrentMediaTime()
        let rawViewTag = createViewCallback(type)
        let callbackDuration = (CACurrentMediaTime() - callbackStartTime) * 1000
        let viewTag = ReactTag(rawViewTag)

        let resolveStartTime = CACurrentMediaTime()
        let resolvedView = try SurfaceHelper.getViewByTag(viewTag)
        let resolveDuration = (CACurrentMediaTime() - resolveStartTime) * 1000

        let viewIdentifier = ObjectIdentifier(resolvedView)
        let viewDebugIdentifier = String(describing: viewIdentifier)
        let totalDuration = (CACurrentMediaTime() - startTime) * 1000
        print(
            "[UserDebug] makeView callback returned type=\(type) " +
            "viewTag=\(viewTag) view=\(viewDebugIdentifier) " +
            "callbackMs=\(callbackDuration) resolveMs=\(resolveDuration) " +
            "totalMs=\(totalDuration)"
        )
        resolvedView.removeFromSuperview()
        return (resolvedView, viewTag)
    }

    private func measure(view: UIView) -> CGSize? {
        view.setNeedsLayout()
        view.layoutIfNeeded()

        let measuredWidth = [view.bounds.width, view.frame.width]
            .filter { $0.isFinite && $0 > 0 }
            .max()
        let measuredHeight = [view.bounds.height, view.frame.height]
            .filter { $0.isFinite && $0 > 0 }
            .max()

        guard let measuredWidth, let measuredHeight else {
            return nil
        }
        return CGSize(width: measuredWidth, height: measuredHeight)
    }

    private func resolvedContentSize(for item: NativeListItem) -> CGSize {
        let measuredSize = measuredContentSizeByItemKey[item.key]
        let width = item.width.map { CGFloat($0) } ?? measuredSize?.width ?? estimatedContentWidth()
        let height = item.height.map { CGFloat($0) } ?? measuredSize?.height ?? estimatedContentHeight()

        return CGSize(width: width, height: height)
    }

    private func captureMeasuredContentSize(for item: NativeListItem, view: UIView) -> Bool {
        guard let measuredSize = measure(view: view) else {
            return false
        }

        let width = item.width.map { CGFloat($0) } ?? measuredSize.width
        let height = item.height.map { CGFloat($0) } ?? measuredSize.height
        let nextSize = CGSize(width: width, height: height)
        let previousSize = measuredContentSizeByItemKey[item.key]

        if let previousSize {
            let widthDelta = abs(previousSize.width - nextSize.width)
            let heightDelta = abs(previousSize.height - nextSize.height)
            // Fabric can report tiny fractional differences for the same rendered row.
            // Ignoring sub-point churn avoids full layout invalidations for visual no-ops.
            if widthDelta < measuredSizeTolerance && heightDelta < measuredSizeTolerance {
                return false
            }
        }

        measuredContentSizeByItemKey[item.key] = nextSize
        return true
    }

    private func needsMeasuredContentSize(for item: NativeListItem) -> Bool {
        return item.width == nil || item.height == nil
    }

    private func estimatedContentWidth() -> CGFloat {
        let collectionWidth = collectionView?.bounds.width ?? view.bounds.width
        let availableWidth = collectionWidth - HostCell.horizontalInset * 2
        guard availableWidth.isFinite, availableWidth > 0 else {
            return 1
        }
        return availableWidth
    }

    private func estimatedContentHeight() -> CGFloat {
        let collectionHeight = collectionView?.bounds.height ?? view.bounds.height
        if collectionHeight.isFinite && collectionHeight > 0 {
            return collectionHeight / 2
        }

        let screenHeight = UIScreen.main.bounds.height
        if screenHeight.isFinite && screenHeight > 0 {
            return screenHeight / 2
        }

        return 120
    }

    private func ensureReuseRegistered(for type: String) {
        guard !registeredReuseIdentifiers.contains(type) else { return }

        collectionView?.register(HostCell.self, forCellWithReuseIdentifier: type)
        registeredReuseIdentifiers.insert(type)
    }

    private func reuseIdentifier(for item: NativeListItem) -> String {
        return item.type
    }

    private func installHostedContent(
        in cell: HostCell,
        item: NativeListItem,
        contentSize: CGSize
    ) throws {
        if cell.hostedContentView != nil {
            guard cell.itemType == item.type else {
                throw RuntimeError.error(
                    withMessage:
                        "CollectionView supplied cell for type '\(cell.itemType ?? "<nil>")' " +
                        "to item type '\(item.type)'."
                )
            }
            let previousKey = cell.itemKey ?? "<nil>"
            let reactTagDescription: String
            if let reactTag = cell.reactTag {
                reactTagDescription = String(reactTag)
            } else {
                reactTagDescription = "<nil>"
            }
            print(
                "[UserDebug] reuse hosted view cell=\(cell.debugIdentifier) " +
                "previousKey=\(previousKey) nextKey=\(item.key) " +
                "type=\(item.type) reactTag=\(reactTagDescription)"
            )
            cell.bind(itemKey: item.key)
            cell.updateContentSize(contentSize)
            return
        }

        print(
            "[UserDebug] create hosted view cell=\(cell.debugIdentifier) " +
            "itemKey=\(item.key) type=\(item.type)"
        )
        let result = try makeView(type: item.type)
        cell.install(
            view: result.0,
            contentSize: contentSize,
            itemKey: item.key,
            itemType: item.type
        )
        cell.reactTag = result.1
    }

    private func retainMeasuredContent(in dataSource: HybridNativeListDataSource) {
        let activeKeys = dataSource.itemsForPremeasurement().map { item in
            item.key
        }
        let activeKeySet = Set(activeKeys)
        measuredContentSizeByItemKey = measuredContentSizeByItemKey.filter { entry in
            return activeKeySet.contains(entry.key)
        }
    }

    private func runOnMain(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async(execute: block)
        }
    }

    private func markLayoutDirty(from index: Int) {
        let layout = collectionView?.collectionViewLayout as? LinearCollectionViewLayout
        layout?.markDirty(from: index)
    }

    private func scheduleLayoutInvalidation(reason: String, from index: Int) {
        markLayoutDirty(from: index)

        if hasScheduledLayoutInvalidation {
            print("[UserDebug] coalesce layout invalidation reason=\(reason)")
            return
        }

        hasScheduledLayoutInvalidation = true
        print("[UserDebug] schedule layout invalidation reason=\(reason)")

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.hasScheduledLayoutInvalidation = false
            print("[UserDebug] run scheduled layout invalidation")
            self.collectionView?.collectionViewLayout.invalidateLayout()
        }
    }

    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return 1
    }

    func collectionView(
        _ collectionView: UICollectionView,
        numberOfItemsInSection section: Int
    ) -> Int {
        guard let dataSource else { return 0 }
        return Int((try? dataSource.getCount()) ?? 0)
    }

    func layoutSizeForItem(at index: Int) -> CGSize {
        guard let dataSource else { return .zero }
        let item = dataSource.item(at: index)
        let contentSize = resolvedContentSize(for: item)
        return layoutProvider.layoutSize(contentSize: contentSize)
    }

    func collectionView(
        _ collectionView: UICollectionView,
        layout collectionViewLayout: UICollectionViewLayout,
        sizeForItemAt indexPath: IndexPath
    ) -> CGSize {
        let size = layoutSizeForItem(at: indexPath.item)
        flowLayoutSizeQueryCount += 1

        let shouldLogEarlyQuery = flowLayoutSizeQueryCount <= 20
        let shouldLogPeriodicQuery = flowLayoutSizeQueryCount % 250 == 0
        if shouldLogEarlyQuery || shouldLogPeriodicQuery {
            print(
                "[UserDebug] flow layout size query count=\(flowLayoutSizeQueryCount) " +
                "index=\(indexPath.item) size=\(size.width)x\(size.height)"
            )
        }

        return size
    }

    func collectionView(
        _ collectionView: UICollectionView,
        cellForItemAt indexPath: IndexPath
    ) -> UICollectionViewCell {
        let totalStartTime = CACurrentMediaTime()
        guard let dataSource else {
            return UICollectionViewCell()
        }

        let itemLookupStartTime = CACurrentMediaTime()
        let item = dataSource.item(at: indexPath.item)
        let itemLookupDuration = (CACurrentMediaTime() - itemLookupStartTime) * 1000

        let reuseIdentifier = reuseIdentifier(for: item)
        ensureReuseRegistered(for: reuseIdentifier)

        let dequeueStartTime = CACurrentMediaTime()
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: reuseIdentifier,
            for: indexPath
        ) as! HostCell
        let dequeueDuration = (CACurrentMediaTime() - dequeueStartTime) * 1000

        let reactTagDescription: String
        if let reactTag = cell.reactTag {
            reactTagDescription = String(reactTag)
        } else {
            reactTagDescription = "<nil>"
        }
        print(
            "[UserDebug] dequeue HostCell index=\(indexPath.item) " +
            "itemKey=\(item.key) type=\(item.type) cell=\(cell.debugIdentifier) " +
            "hasHostedView=\(cell.hasHostedView) reactTag=\(reactTagDescription)"
        )

        let contentSize = resolvedContentSize(for: item)

        let installStartTime = CACurrentMediaTime()
        do {
            try installHostedContent(in: cell, item: item, contentSize: contentSize)
        } catch {
            print("Failed to create list item view: \(error)")
        }
        let installDuration = (CACurrentMediaTime() - installStartTime) * 1000

        var prepareDuration = 0.0
        var updateViewDuration = 0.0
        if let reactTag = cell.reactTag {
            let width = item.width.map { CGFloat($0) }
            let height = item.height.map { CGFloat($0) }

            let prepareStartTime = CACurrentMediaTime()
            cell.prepareForMeasurement(width: width, height: height)
            prepareDuration = (CACurrentMediaTime() - prepareStartTime) * 1000

            let updateViewStartTime = CACurrentMediaTime()
            _ = updateViewCallback?(Double(reactTag), item, Double(indexPath.item))
            updateViewDuration = (CACurrentMediaTime() - updateViewStartTime) * 1000
        }

        var measureDuration = 0.0
        var updateContentSizeDuration = 0.0
        if let hostedView = cell.hostedContentView, needsMeasuredContentSize(for: item) {
            let measureStartTime = CACurrentMediaTime()
            let didMeasureNewSize = captureMeasuredContentSize(for: item, view: hostedView)
            measureDuration = (CACurrentMediaTime() - measureStartTime) * 1000
            let measuredContentSize = resolvedContentSize(for: item)

            let updateContentSizeStartTime = CACurrentMediaTime()
            cell.updateContentSize(measuredContentSize)
            updateContentSizeDuration = (CACurrentMediaTime() - updateContentSizeStartTime) * 1000

            if didMeasureNewSize {
                print(
                    "[UserDebug] invalidate layout measured itemKey=\(item.key) " +
                    "index=\(indexPath.item) measuredSize=\(measuredContentSize.width)x\(measuredContentSize.height)"
                )
                scheduleLayoutInvalidation(reason: "measured", from: indexPath.item)
            }
        }

        let totalDuration = (CACurrentMediaTime() - totalStartTime) * 1000
        print(
            "[UserDebug] cellForItemAt timing index=\(indexPath.item) " +
            "itemKey=\(item.key) itemLookupMs=\(itemLookupDuration) " +
            "dequeueMs=\(dequeueDuration) installMs=\(installDuration) " +
            "prepareMs=\(prepareDuration) updateViewMs=\(updateViewDuration) " +
            "measureMs=\(measureDuration) updateContentSizeMs=\(updateContentSizeDuration) " +
            "totalMs=\(totalDuration)"
        )

        return cell
    }
}

extension HybridUiListView: NativeListDataSourceObserver {
    func dataSourceDidReload(
        _ dataSource: HybridNativeListDataSource,
        animated: Bool,
        changeset: StagedChangeset<[DiffableListItem]>?
    ) {
        runOnMain { [weak self] in
            guard let self else { return }
            configureCollectionViewIfNeeded()
            retainMeasuredContent(in: dataSource)
            markLayoutDirty(from: 0)

            guard animated, let collectionView, let changeset else {
                collectionView?.reloadData()
                return
            }

            collectionView.reload(using: changeset) { nextItems in
                dataSource.replaceWrappedItemsFromCollectionView(nextItems)
                self.markLayoutDirty(from: 0)
                collectionView.collectionViewLayout.invalidateLayout()
            }
        }
    }

    func dataSourceDidInsert(_ dataSource: HybridNativeListDataSource, index: Int) {
        runOnMain { [weak self] in
            guard let self else { return }
            let item = dataSource.item(at: index)
            let reuseIdentifier = reuseIdentifier(for: item)
            ensureReuseRegistered(for: reuseIdentifier)
            let indexPath = IndexPath(item: index, section: 0)
            let indexPaths = [indexPath]
            markLayoutDirty(from: index)
            collectionView?.insertItems(at: indexPaths)
        }
    }

    func dataSourceDidUpdate(
        _ dataSource: HybridNativeListDataSource,
        index: Int,
        previousItem: NativeListItem
    ) {
        runOnMain { [weak self] in
            guard let self else { return }
            let item = dataSource.item(at: index)
            if previousItem.key != item.key {
                measuredContentSizeByItemKey[previousItem.key] = nil
            }

            let reuseIdentifier = reuseIdentifier(for: item)
            ensureReuseRegistered(for: reuseIdentifier)
            let indexPath = IndexPath(item: index, section: 0)
            let indexPaths = [indexPath]
            markLayoutDirty(from: index)
            collectionView?.reloadItems(at: indexPaths)
        }
    }

    func dataSourceDidRemove(
        _ dataSource: HybridNativeListDataSource,
        index: Int,
        removedItem: NativeListItem
    ) {
        runOnMain { [weak self] in
            guard let self else { return }
            measuredContentSizeByItemKey[removedItem.key] = nil
            let indexPath = IndexPath(item: index, section: 0)
            let indexPaths = [indexPath]
            markLayoutDirty(from: index)
            collectionView?.deleteItems(at: indexPaths)
        }
    }

    func dataSourceDidMove(_ dataSource: HybridNativeListDataSource, fromIndex: Int, toIndex: Int) {
        runOnMain { [weak self] in
            guard let self else { return }
            let sourceIndexPath = IndexPath(item: fromIndex, section: 0)
            let targetIndexPath = IndexPath(item: toIndex, section: 0)
            markLayoutDirty(from: min(fromIndex, toIndex))
            collectionView?.moveItem(at: sourceIndexPath, to: targetIndexPath)
        }
    }
}
