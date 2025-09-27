// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title WrappedToken
 * @dev ERC20 token that can be minted and burned by bridge contract
 */
contract WrappedToken is ERC20, Ownable, Pausable {
    // ============ State Variables ============

    address public bridge; // Bridge contract address that can mint/burn
    uint8 private _decimals; // Token decimals

    // ============ Events ============

    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    // ============ Modifiers ============

    modifier onlyBridge() {
        require(msg.sender == bridge, "Only bridge can call this function");
        _;
    }

    // ============ Constructor ============

    constructor(
        string memory name,
        string memory symbol,
        uint8 tokenDecimals,
        address bridgeAddress
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = tokenDecimals;
        bridge = bridgeAddress;
    }

    // ============ Bridge Functions ============

    function mint(
        address to,
        uint256 amount
    ) external onlyBridge whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(
        address from,
        uint256 amount
    ) external onlyBridge whenNotPaused {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");

        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    function burnAndBridge(
        uint256 amount,
        uint256 destinationChainId,
        address destinationAddress,
        address originalToken
    ) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(destinationAddress != address(0), "Invalid destination address");

        // 토큰 소각
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);

        // Bridge에 크로스체인 전송 알림
        (bool success,) = bridge.call(
            abi.encodeWithSignature(
                "handleBurn(address,address,uint256,uint256,address)",
                originalToken,
                msg.sender,
                amount,
                destinationChainId,
                destinationAddress
            )
        );
        require(success, "Bridge notification failed");
    }

    // ============ Admin Functions ============

    function setBridge(address newBridge) external onlyOwner {
        require(newBridge != address(0), "Bridge address cannot be zero");
        require(newBridge != bridge, "Same bridge address");

        address oldBridge = bridge;
        bridge = newBridge;

        emit BridgeUpdated(oldBridge, newBridge);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Override Functions ============

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override whenNotPaused {
        super._update(from, to, value);
    }

    // ============ View Functions ============

    function getBridge() external view returns (address) {
        return bridge;
    }
}
