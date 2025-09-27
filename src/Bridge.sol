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

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event RequiredSignaturesChanged(uint256 oldRequired, uint256 newRequired);

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
        bytes32 transactionId,
        bytes[] calldata signatures
    ) external {
        require(!processedTransactions[transactionId], "Transaction already processed");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        require(lockedBalances[token] >= amount, "Insufficient locked balance");

        // 서명 검증을 위한 메시지 생성
        bytes32 message = keccak256(abi.encodePacked(
            token,
            user,
            amount,
            transactionId,
            chainId
        ));

        require(_verifySignatures(message, signatures), "Invalid signatures");

        processedTransactions[transactionId] = true;
        lockedBalances[token] -= amount;

        // 토큰을 사용자에게 전송
        (bool success,) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", user, amount)
        );
        require(success, "Token transfer failed");

        emit TokensUnlocked(token, user, amount, transactionId);
    }

    // ============ Validator Management ============

    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator address");
        require(!validators[validator], "Validator already exists");
        require(validatorCount < MAX_VALIDATORS, "Too many validators");

        validators[validator] = true;
        validatorCount++;

        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "Validator does not exist");
        require(validatorCount > MIN_VALIDATORS, "Cannot remove last validator");
        require(validatorCount - 1 >= requiredSignatures, "Would break required signatures");

        validators[validator] = false;
        validatorCount--;

        emit ValidatorRemoved(validator);
    }

    function setRequiredSignatures(uint256 _requiredSignatures) external onlyOwner {
        require(_requiredSignatures > 0, "Required signatures must be > 0");
        require(_requiredSignatures <= validatorCount, "Required signatures too high");

        uint256 oldRequired = requiredSignatures;
        requiredSignatures = _requiredSignatures;

        emit RequiredSignaturesChanged(oldRequired, _requiredSignatures);
    }

    // ============ Internal Functions ============

    function _verifySignatures(bytes32 message, bytes[] calldata signatures) internal view returns (bool) {
        bytes32 ethSignedMessage = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));

        address[] memory signers = new address[](signatures.length);
        uint256 validSignatures = 0;

        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(ethSignedMessage, signatures[i]);

            if (validators[signer]) {
                // 중복 서명 체크
                bool duplicate = false;
                for (uint256 j = 0; j < validSignatures; j++) {
                    if (signers[j] == signer) {
                        duplicate = true;
                        break;
                    }
                }

                if (!duplicate) {
                    signers[validSignatures] = signer;
                    validSignatures++;
                }
            }
        }

        return validSignatures >= requiredSignatures;
    }

    function _recoverSigner(bytes32 message, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v value");

        return ecrecover(message, v, r, s);
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

    function isValidator(address account) external view returns (bool) {
        return validators[account];
    }
}
