// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBridge {
    struct Transaction {
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint256 nonce;
        uint256 sourceChainId;
        uint256 targetChainId;
        bytes32 transactionHash;
    }

    event TokensLocked(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 targetChainId,
        address recipient,
        uint256 nonce
    );

    event TokensUnlocked(
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 transactionHash
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    function lockTokens(
        address token,
        uint256 amount,
        uint256 targetChainId,
        address recipient
    ) external;

    function unlockTokens(
        Transaction memory transaction,
        bytes[] memory signatures
    ) external;

    function addValidator(address validator) external;

    function removeValidator(address validator) external;

    function isValidator(address validator) external view returns (bool);

    function getRequiredSignatures() external view returns (uint256);
}
