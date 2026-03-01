//
//  HybridUiListView.swift
//  NitroList
//
//  Created by Hanno Gödecke on 14.02.26.
//

import Foundation
import UIKit
import NitroModules

// MARK: - Item Protocol

protocol CollectionItem {
    /// A reuse identifier derived from the concrete type
    var reuseIdentifier: String { get }

    /// Create a fresh UIView for this kind of item
    func makeView() -> UIView

    /// Bind data into an already-created view
    func bind(view: UIView)
}

extension CollectionItem {
    var reuseIdentifier: String { String(describing: type(of: self)) }
}

struct AnyCollectionItem: Hashable {
    let item: any CollectionItem
    private let id: String
    private let typeId: String

    init(_ item: any CollectionItem & Hashable) {
        self.item = item
        // Use the underlying Hashable conformance for identity
        self.typeId = item.reuseIdentifier
        // We need a stable id — use the hash
        var hasher = Hasher()
        item.hash(into: &hasher)
        self.id = "\(self.typeId)-\(hasher.finalize())"
    }

    static func == (lhs: AnyCollectionItem, rhs: AnyCollectionItem) -> Bool {
        lhs.id == rhs.id && lhs.typeId == rhs.typeId
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(typeId)
    }
}

/// A cell that hosts an arbitrary UIView produced by a CollectionItem.
/// The hosted view is pinned horizontally and top-aligned; explicit height
/// from React bounds drives sizing to avoid expensive Auto Layout solving.
final class HostCell: UICollectionViewCell {

    static let verticalInset: CGFloat = 8
    static let horizontalInset: CGFloat = 16

    private var hostedView: UIView?
    
    var reactTag: Int?

    /// Install a view created by `item.makeView()`.
    func install(view: UIView, contentHeight: CGFloat) {
        hostedView?.removeFromSuperview()
        hostedView = view

        view.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(view)

        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: contentView.topAnchor, constant: Self.verticalInset),
            view.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: Self.horizontalInset),
            view.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -Self.horizontalInset),
            view.heightAnchor.constraint(equalToConstant: contentHeight),
        ])
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        // We keep the hosted view — it will be re-bound.
        // If reuse identifiers match, the view hierarchy is compatible.
    }

}

// MARK: - List

final class CollectionViewDataSourceProxy: NSObject, UICollectionViewDataSource {
    weak var owner: HybridUiListView?

    init(owner: HybridUiListView) {
        self.owner = owner
        super.init()
    }

    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return owner?.numberOfSections(in: collectionView) ?? 0
    }

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return owner?.collectionView(collectionView, numberOfItemsInSection: section) ?? 0
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let owner else {
            return UICollectionViewCell()
        }
        return owner.collectionView(collectionView, cellForItemAt: indexPath)
    }
}

class HybridUiListView : HybridUiListViewSpec {
    let view: UIView
    private var collectionView: UICollectionView?
    private let reuseId = "main"
    private var mainItems: [Int] = []
    private var collectionDataSourceProxy: CollectionViewDataSourceProxy?
    private var measuredContentSizeByReuseIdentifier: [String: CGSize] = [:]
    private var premeasuredViewByReuseIdentifier: [String: (view: UIView, tag: ReactTag)] = [:]
    
    override init() {
        view = UIView(frame: .zero)
        super.init()
    }
    
    var makeViewCallback: (() -> Double)?
    func setMakeNativeViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping () -> Double) throws {
        makeViewCallback = callback
    }
    
    var updateViewCallback: ((_ reactTag: Double, _ index: Double) -> Bool)?
    func setUpdateViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping (Double, Double) -> Bool) throws {
        updateViewCallback = callback;

        premeasureItemTypeIfNeeded(reuseIdentifier: reuseId)
        guard let contentSize = measuredContentSizeByReuseIdentifier[reuseId] else {
            fatalError("Developer error: Missing measured content size for reuseIdentifier '\(reuseId)'.")
        }
        
        collectionView = UICollectionView(frame: .zero, collectionViewLayout: createLayout(contentSize: contentSize))

        configureRootView()
        configureCollectionView(collectionView: collectionView!)
        configureDataSource(collectionView: collectionView!)
        applySnapshot()
    }
    
    func makeView() throws -> (UIView, ReactTag, CGSize?) {
        guard let safeMakeViewCallback = makeViewCallback else {
            throw RuntimeError.error(withMessage: "Can only call makeView when setMakeNativeViewCallback called prior")
        }

        let viewTag = ReactTag(safeMakeViewCallback())
        let resolvedView = try SurfaceHelper.getViewByTag(viewTag)
        let measuredWidth = [resolvedView.bounds.width, resolvedView.frame.width]
            .filter { $0.isFinite && $0 > 0 }
            .max()
        let measuredHeight = [resolvedView.bounds.height, resolvedView.frame.height]
            .filter { $0.isFinite && $0 > 0 }
            .max()
        resolvedView.removeFromSuperview()
        if let measuredWidth, let measuredHeight {
            return (resolvedView, viewTag, CGSize(width: measuredWidth, height: measuredHeight))
        } else {
            return (resolvedView, viewTag, nil)
        }
    }
    
    // MARK: - Collection View
    private func createLayout(contentSize: CGSize) -> UICollectionViewCompositionalLayout {
        let containerWidth = ceil(contentSize.width + HostCell.horizontalInset * 2)
        let containerHeight = ceil(contentSize.height + HostCell.verticalInset * 2)
        return UICollectionViewCompositionalLayout { _, _ in
            // Fixed-size list rows (per type) to avoid self-sizing solver churn while scrolling.
            let itemSize = NSCollectionLayoutSize(
                widthDimension: .absolute(containerWidth),
                heightDimension: .absolute(containerHeight)
            )
            let item = NSCollectionLayoutItem(layoutSize: itemSize)

            let groupSize = NSCollectionLayoutSize(
                widthDimension: .absolute(containerWidth),
                heightDimension: .absolute(containerHeight)
            )
            let group = NSCollectionLayoutGroup.vertical(
                layoutSize: groupSize, subitems: [item]
            )

            let section = NSCollectionLayoutSection(group: group)
            section.interGroupSpacing = 12
            section.contentInsets = NSDirectionalEdgeInsets(
                top: 16, leading: 0, bottom: 16, trailing: 0
            )
            return section
        }
    }

    private func premeasureItemTypeIfNeeded(reuseIdentifier: String) {
        guard measuredContentSizeByReuseIdentifier[reuseIdentifier] == nil else { return }

        do {
            let (view, tag, measuredSize) = try makeView()
            guard let measuredSize else {
                fatalError(
                    "Developer error: Failed to measure item size for reuseIdentifier '\(reuseIdentifier)'. " +
                    "makeView() returned a view without finite non-zero bounds/frame size."
                )
            }
            measuredContentSizeByReuseIdentifier[reuseIdentifier] = measuredSize
            premeasuredViewByReuseIdentifier[reuseIdentifier] = (view: view, tag: tag)
        } catch {
            fatalError(
                "Developer error: Failed to pre-measure item type '\(reuseIdentifier)': \(error)"
            )
        }
    }
    

    func configureCollectionView(collectionView: UICollectionView) {
        collectionView.backgroundColor = .systemBackground
        collectionView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(collectionView)
        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.topAnchor),
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            collectionView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    func configureRootView() {
        view.backgroundColor = .clear
    }

    // MARK: - Data Source

    func configureDataSource(collectionView: UICollectionView) {
        collectionView.register(HostCell.self, forCellWithReuseIdentifier: reuseId)
        let proxy = CollectionViewDataSourceProxy(owner: self)
        collectionDataSourceProxy = proxy
        collectionView.dataSource = proxy
    }

    // MARK: - Snapshot

    func applySnapshot(animating: Bool = true) {
        var items: [Int] = []
        for i in 0..<10000 {
            items.append(i)
        }
        mainItems = items

        let reload: () -> Void = { [weak self] in
            guard let self else { return }
            self.collectionView?.reloadData()
        }
        if Thread.isMainThread {
            reload()
        } else {
            DispatchQueue.main.async(execute: reload)
        }
    }

    // MARK: - UICollectionViewDataSource

    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return 1
    }

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return mainItems.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: reuseId,
            for: indexPath
        ) as! HostCell

        guard let contentSize = measuredContentSizeByReuseIdentifier[reuseId] else {
            fatalError("Developer error: Missing measured content size for reuseIdentifier '\(reuseId)'.")
        }
        if cell.contentView.subviews.isEmpty {
            if let premeasured = premeasuredViewByReuseIdentifier.removeValue(forKey: reuseId) {
                cell.install(view: premeasured.view, contentHeight: contentSize.height)
                cell.reactTag = premeasured.tag
            } else {
                do {
                    let res = try makeView()
                    cell.install(view: res.0, contentHeight: contentSize.height)
                    cell.reactTag = res.1
                } catch {
                    print("❌ Failed to create view: \(error)")
                }
            }
        }

        if let reactTag = cell.reactTag {
            let index = mainItems[indexPath.item]
            _ = updateViewCallback?(Double(reactTag), Double(index))
        }

        return cell
    }
}
