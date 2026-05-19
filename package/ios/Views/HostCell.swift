import UIKit

final class HostCell: UICollectionViewCell {

    static let verticalInset: CGFloat = 8
    static let horizontalInset: CGFloat = 16

    private var hostedView: UIView?
    private var widthConstraint: NSLayoutConstraint?
    private var heightConstraint: NSLayoutConstraint?

    var reactTag: Int?
    var itemKey: String?
    var itemType: String?
    var hasHostedView: Bool {
        return hostedView != nil
    }
    var hostedContentView: UIView? {
        return hostedView
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        print("[UserDebug] create HostCell cell=\(debugIdentifier)")
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        print("[UserDebug] create HostCell cell=\(debugIdentifier)")
    }

    var debugIdentifier: String {
        let objectIdentifier = ObjectIdentifier(self)
        return String(describing: objectIdentifier)
    }

    func install(view: UIView, contentSize: CGSize, itemKey: String, itemType: String) {
        if let currentHostedView = hostedView {
            let isCurrentViewOwnedByCell = currentHostedView.superview === contentView
            if isCurrentViewOwnedByCell {
                deactivateInstalledConstraints(for: currentHostedView)
                currentHostedView.removeFromSuperview()
            }
        }

        deactivateInstalledConstraints(for: view)
        view.removeFromSuperview()

        hostedView = view
        self.itemKey = itemKey
        self.itemType = itemType

        let viewIdentifier = ObjectIdentifier(view)
        let viewDebugIdentifier = String(describing: viewIdentifier)
        print(
            "[UserDebug] install hosted view cell=\(debugIdentifier) " +
            "itemKey=\(itemKey) type=\(itemType) view=\(viewDebugIdentifier) " +
            "contentSize=\(contentSize.width)x\(contentSize.height)"
        )

        view.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(view)

        let widthConstraint = view.widthAnchor.constraint(equalToConstant: contentSize.width)
        let heightConstraint = view.heightAnchor.constraint(equalToConstant: contentSize.height)
        self.widthConstraint = widthConstraint
        self.heightConstraint = heightConstraint

        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: contentView.topAnchor, constant: Self.verticalInset),
            view.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: Self.horizontalInset),
            widthConstraint,
            heightConstraint,
        ])
    }

    func bind(itemKey: String) {
        let previousKey = self.itemKey ?? "<nil>"
        let previousType = itemType ?? "<nil>"
        let reactTagDescription: String
        if let reactTag {
            reactTagDescription = String(reactTag)
        } else {
            reactTagDescription = "<nil>"
        }
        print(
            "[UserDebug] rebind HostCell cell=\(debugIdentifier) " +
            "previousKey=\(previousKey) nextKey=\(itemKey) type=\(previousType) " +
            "reactTag=\(reactTagDescription)"
        )
        self.itemKey = itemKey
    }

    func prepareForMeasurement(width: CGFloat, height: CGFloat?) {
        // Text-like rows need a concrete width to wrap before we can measure natural height.
        setWidthConstraint(width)

        if let height {
            setHeightConstraint(height)
        } else {
            deactivateHeightConstraint()
        }
    }

    func updateContentSize(_ contentSize: CGSize) {
        setWidthConstraint(contentSize.width)
        setHeightConstraint(contentSize.height)
    }

    func detachHostedView() {
        if let hostedView {
            let isHostedViewOwnedByCell = hostedView.superview === contentView
            if isHostedViewOwnedByCell {
                deactivateInstalledConstraints(for: hostedView)
                hostedView.removeFromSuperview()
            }
        }

        hostedView = nil
        reactTag = nil
        itemKey = nil
        itemType = nil
        widthConstraint = nil
        heightConstraint = nil
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        let previousKey = itemKey ?? "<nil>"
        let previousType = itemType ?? "<nil>"
        let reactTagDescription: String
        if let reactTag {
            reactTagDescription = String(reactTag)
        } else {
            reactTagDescription = "<nil>"
        }
        print(
            "[UserDebug] prepareForReuse HostCell cell=\(debugIdentifier) " +
            "previousKey=\(previousKey) type=\(previousType) " +
            "hasHostedView=\(hasHostedView) reactTag=\(reactTagDescription)"
        )
        itemKey = nil
        if let hostedView {
            contentView.bringSubviewToFront(hostedView)
        }
    }

    private func deactivateInstalledConstraints(for view: UIView) {
        let localConstraints = view.constraints.filter { constraint in
            let isWidthConstraint = constraint.firstAttribute == .width
            let isHeightConstraint = constraint.firstAttribute == .height
            let isSizeConstraint = isWidthConstraint || isHeightConstraint
            let firstView = constraint.firstItem as? UIView
            let isOwnedByView = firstView === view
            let isLocalConstraint = constraint.secondItem == nil
            return isSizeConstraint && isOwnedByView && isLocalConstraint
        }
        NSLayoutConstraint.deactivate(localConstraints)

        guard let superview = view.superview else { return }

        let parentConstraints = superview.constraints.filter { constraint in
            let firstView = constraint.firstItem as? UIView
            let secondView = constraint.secondItem as? UIView
            let usesFirstView = firstView === view
            let usesSecondView = secondView === view
            return usesFirstView || usesSecondView
        }
        NSLayoutConstraint.deactivate(parentConstraints)
    }

    private func setWidthConstraint(_ width: CGFloat) {
        if let widthConstraint {
            widthConstraint.constant = width
            if !widthConstraint.isActive {
                widthConstraint.isActive = true
            }
            return
        }

        guard let hostedView else { return }
        let widthConstraint = hostedView.widthAnchor.constraint(equalToConstant: width)
        self.widthConstraint = widthConstraint
        widthConstraint.isActive = true
    }

    private func setHeightConstraint(_ height: CGFloat) {
        if let heightConstraint {
            heightConstraint.constant = height
            if !heightConstraint.isActive {
                heightConstraint.isActive = true
            }
            return
        }

        guard let hostedView else { return }
        let heightConstraint = hostedView.heightAnchor.constraint(equalToConstant: height)
        self.heightConstraint = heightConstraint
        heightConstraint.isActive = true
    }

    private func deactivateWidthConstraint() {
        guard let widthConstraint else { return }
        widthConstraint.isActive = false
        self.widthConstraint = nil
    }

    private func deactivateHeightConstraint() {
        guard let heightConstraint else { return }
        heightConstraint.isActive = false
        self.heightConstraint = nil
    }
}
