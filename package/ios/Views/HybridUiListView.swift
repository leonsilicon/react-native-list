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
/// The hosted view is pinned to the contentView edges so Auto Layout
/// drives self-sizing.
final class HostCell: UICollectionViewCell {

    private var hostedView: UIView?
    
    var reactTag: Int?

    /// Install a view created by `item.makeView()`.
    func install(view: UIView) {
        hostedView?.removeFromSuperview()
        hostedView = view

        view.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(view)
        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 8),
            view.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            view.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            view.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -8),
        ])
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        // We keep the hosted view — it will be re-bound.
        // If reuse identifiers match, the view hierarchy is compatible.
    }
}

// MARK: - List

class HybridUiListView : HybridUiListViewSpec {
    let view: UIView
    private var collectionView: UICollectionView?
    
    enum Section: Int, CaseIterable {
        case main
    }
    
    struct Item {
        let reactTag: Int
        let data: Int
    }

    var dataSource: UICollectionViewDiffableDataSource<Section, Int>!
    
    override init() {
        view = UIView(frame: .zero)
        super.init()
    }
    
    var makeViewCallback: (() -> Double)?
    func setMakeNativeViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping () -> Double) throws {
        makeViewCallback = callback;
    }
    
    var updateViewCallback: ((_ reactTag: Double, _ index: Double) -> Bool)?
    func setUpdateViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping (Double, Double) -> Bool) throws {
        updateViewCallback = callback;
        
        let test = try makeView();
        let skr = test;
//        collectionView = UICollectionView(frame: .zero, collectionViewLayout: createLayout())
//
//        configureRootView()
//        configureCollectionView(collectionView: collectionView!)
//        configureDataSource(collectionView: collectionView!)
//        applySnapshot()
    }
    
    func makeView() throws -> (UIView, ReactTag) {
        guard let safeMakeViewCallback = makeViewCallback else {
            throw RuntimeError.error(withMessage: "Can only call makeView when setMakeNativeViewCallback called prior")
        }

        let viewTag = ReactTag(safeMakeViewCallback())
        let resolvedView = try SurfaceHelper.getViewByTag(viewTag)
        resolvedView.removeFromSuperview()
        return (resolvedView, viewTag)
    }
    
    // MARK: - Collection View
    private func createLayout() -> UICollectionViewCompositionalLayout {
        UICollectionViewCompositionalLayout { sectionIndex, environment in
            guard let section = Section(rawValue: sectionIndex) else { return nil }
            
            switch section {
                case .main:
                // Full-width, self-sizing height
                let itemSize = NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(1.0),
                    heightDimension: .estimated(100)
                )
                let item = NSCollectionLayoutItem(layoutSize: itemSize)

                let groupSize = NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(1.0),
                    heightDimension: .estimated(100)
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

    // MARK: - Diffable Data Source

    func configureDataSource(collectionView: UICollectionView) {
        dataSource = UICollectionViewDiffableDataSource<Section, Int>(collectionView: collectionView) {
            collectionView, indexPath, item in
            
            var reuseId = "main"
             collectionView.register(HostCell.self, forCellWithReuseIdentifier: reuseId)

            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: reuseId, for: indexPath
            ) as! HostCell

            // If the cell has no hosted view yet (fresh or recycled from the same reuse pool), create one.
            // We check by looking at contentView's subviews.
            if cell.contentView.subviews.isEmpty {
                let res = try? self.makeView()
                if (res != nil){
                    cell.install(view: res!.0)
                    cell.reactTag = res!.1
                    print("Created view with tag %d" , cell.reactTag)
                } else {
                    print("FAILED TO CREAT CELL!!")
                }
            }

            // Bind data - works on both fresh and reused cells.
            if let hostedView = cell.contentView.subviews.first {
                let reactTag = cell.reactTag!
                let success = self.updateViewCallback!(Double(reactTag), Double(item))
                print("Updated view for react tag %d success=%b", reactTag, success)
            }

            return cell
        }
    }

    // MARK: - Snapshot

    func applySnapshot(animating: Bool = true) {
        var snapshot = NSDiffableDataSourceSnapshot<Section, Int>()
        snapshot.appendSections(Section.allCases)
        
        var mainItems: [Int] = []
        for i in 0..<5 {
            mainItems.append(i)
        }
        
        snapshot.appendItems(mainItems, toSection: .main)
        dataSource.apply(snapshot, animatingDifferences: false)
    }
}
