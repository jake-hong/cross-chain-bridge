// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Bridge
 * @dev Cross-chain bridge contract for locking and unlocking tokens
 */
contract Bridge {
    // ============ State Variables ============

    // 검증자(Validator) 관리
    mapping(address => bool) public validators; // 주소가 검증자인지 확인
    uint256 public validatorCount; // 총 검증자 수
    uint256 public requiredSignatures; // 필요한 최소 서명 수

    // 트랜잭션 관리
    mapping(bytes32 => bool) public processedTransactions; // 이미 처리된 트랜잭션
    mapping(address => uint256) public nonces; // 각 사용자의 nonce (재사용 방지)

    // 체인 정보
    uint256 public chainId; // 현재 체인 ID (Ethereum=1, Polygon=137 등)

    // 관리자
    address public owner;

    // 토큰 잠금 관리
    mapping(address => uint256) public lockedBalances; // 토큰별 잠긴 총량

    // 상수
    uint256 public constant MIN_VALIDATORS = 1;
    uint256 public constant MAX_VALIDATORS = 20;

    // ============ Events ============

    event TokensLocked(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint256 destinationChainId,
        address destinationAddress,
        uint256 nonce
    );

    event TokensUnlocked(
        address indexed token,
        address indexed user,
        uint256 amount,
        bytes32 indexed transactionId
    );

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ============ Constructor ============

    constructor(uint256 _chainId, uint256 _requiredSignatures) {
        chainId = _chainId;
        requiredSignatures = _requiredSignatures;
        owner = msg.sender;
    }

    // ============ Lock Functions ============

    function lockTokens(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        address destinationAddress
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(destinationAddress != address(0), "Invalid destination address");
        require(destinationChainId != chainId, "Cannot bridge to same chain");

        // ERC20 토큰을 이 컨트랙트로 전송
        // 실제 구현시에는 SafeERC20 사용 예정
        (bool success,) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)",
                msg.sender, address(this), amount)
        );
        require(success, "Token transfer failed");

        lockedBalances[token] += amount;
        uint256 userNonce = nonces[msg.sender];
        nonces[msg.sender]++;

        emit TokensLocked(
            token,
            msg.sender,
            amount,
            destinationChainId,
            destinationAddress,
            userNonce
        );
    }

    // ============ Unlock Functions ============

    function unlockTokens(
        address token,
        address user,
        uint256 amount,
        bytes32 transactionId
    ) external onlyOwner {
        require(!processedTransactions[transactionId], "Transaction already processed");
        require(lockedBalances[token] >= amount, "Insufficient locked balance");

        processedTransactions[transactionId] = true;
        lockedBalances[token] -= amount;

        // 토큰을 사용자에게 전송
        (bool success,) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", user, amount)
        );
        require(success, "Token transfer failed");

        emit TokensUnlocked(token, user, amount, transactionId);
    }

    // ============ View Functions ============

    function getLockedBalance(address token) external view returns (uint256) {
        return lockedBalances[token];
    }

    function isTransactionProcessed(bytes32 transactionId) external view returns (bool) {
        return processedTransactions[transactionId];
    }

    function getUserNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
}
