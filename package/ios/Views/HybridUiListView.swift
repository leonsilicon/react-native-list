//
//  HybridUiListView.swift
//  NitroList
//
//  Created by Hanno Gödecke on 14.02.26.
//

import Foundation

class HybridUiListView : HybridUiListViewSpec {
    typealias ViewType = UICollectionView
    var view: UICollectionView
    
    override init() {
        view = UICollectionView()
    }
    
    func setMakeNativeViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping () -> Double) throws {
        // TODO: implement
    }
    
    func setUpdateViewCallback(uiListModule: any HybridUiListModuleSpec, callback: @escaping (Double, Double) -> Bool) throws {
        // TODO: implement
    }
    
    
}
