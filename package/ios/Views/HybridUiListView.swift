//
//  HybridUiListView.swift
//  NitroList
//
//  Created by Hanno Gödecke on 14.02.26.
//

import Foundation
import UIKit
import NitroModules

class HybridUiListView : HybridUiListViewSpec {
    let view: UIView
    private var collectionView: UICollectionView?
    
    enum Section {
        case main
    }

    struct Item: Hashable {
        let id = UUID()
        let title: String
    }

    var dataSource: UICollectionViewDiffableDataSource<Section, Item>!
    let items = Array(1...50).map { Item(title: "Item \($0)") }
    
    override init() {
        view = UIView(frame: .zero)
        super.init()

        let layout = UICollectionViewFlowLayout()
        layout.itemSize = CGSize(width: 100, height: 100)
        layout.minimumInteritemSpacing = 10
        layout.minimumLineSpacing = 10
        layout.sectionInset = UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10)

        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)

        configureRootView()
        configureCollectionView(collectionView: collectionView!)
        configureDataSource(collectionView: collectionView!)
        applySnapshot()
    }
    
    var makeViewCallback: (() -> Double)?
    func setMakeNativeViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping () -> Double) throws {
        makeViewCallback = callback;
        
        let test = try makeView();
        let skr = test;
    }
    
    var updateViewCallback: ((_ reactTag: Double, _ index: Double) -> Bool)?
    func setUpdateViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping (Double, Double) -> Bool) throws {
        updateViewCallback = callback;
    }
    
    func makeView() throws -> UIView {
        guard let safeMakeViewCallback = makeViewCallback else {
            throw RuntimeError.error(withMessage: "Can only call makeView when setMakeNativeViewCallback called prior")
        }

        let viewTag = ReactTag(safeMakeViewCallback())
        let resolvedView = try SurfaceHelper.getViewByTag(viewTag)
        // TODO: remove resolvedView here from parent?
        return resolvedView
    }
    
    // MARK: - Collection View

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
        // Register cell with a cell registration (modern API)
        let cellRegistration = UICollectionView.CellRegistration<UICollectionViewCell, Item> { cell, indexPath, item in
            var config = UIListContentConfiguration.cell()
            config.text = item.title
            config.textProperties.alignment = .center
            cell.contentConfiguration = config
            cell.contentView.backgroundColor = .systemBlue
        }

        dataSource = UICollectionViewDiffableDataSource<Section, Item>(collectionView: collectionView) {
            collectionView, indexPath, item in
            return collectionView.dequeueConfiguredReusableCell(using: cellRegistration, for: indexPath, item: item)
        }
    }

    // MARK: - Snapshot

    func applySnapshot(animating: Bool = true) {
        var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
        snapshot.appendSections([.main])
        snapshot.appendItems(items, toSection: .main)
        dataSource.apply(snapshot, animatingDifferences: animating)
    }
}
