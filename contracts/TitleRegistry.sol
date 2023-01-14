// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TitleRegistry is ReentrancyGuard {
    error PriceMustBeAboveZero();
    // error NotApprovedForSystem();
    error NotApprovedByOwner();
    // error AlreadyListed(address titleAddress, uint256 tokenId);
    error NotOwner();

    error NotAdmin();
    // error NotListed(address titleAddress, uint256 tokenId);
    // error NoProceeds();
    error OwnerMustBeFromTheSameNeighborhood(
        address owner,
        string neighborhood
    );
    // error TransferFailed();
    error PriceNotMet(uint256 surveyNumber, uint256 price);

    event PropertyListed(
        address indexed seller,
        uint256 indexed surveyNumber,
        uint256 price
    );

    event PropertyBought(
        address indexed buyer,
        uint256 indexed surveyNumber,
        uint256 price
    );

    event TransactionCanceled(
        address indexed seller,
        uint256 indexed surveyNumber
    );

    // Estructura de un titulo de propiedad
    struct TitleDetails {
        string state;
        string district;
        string neighborhood;
        uint256 surveyNumber;
        address payable currentOwner;
        uint256 marketValue;
        bool isAvailable;
        address requester;
        ReqStatus requestStatus;
    }

    receive() external payable {} // to support receiving ETH by default

    fallback() external payable {}

    // Estado de la solicitud de transferencia
    enum ReqStatus {
        DEFAULT,
        PENDING,
        REJECTED,
        APPROVED
    }

    // Perfil de un usuario
    struct Profiles {
        uint256[] assetList;
    }

    mapping(uint256 => TitleDetails) private land;
    address private admin;
    mapping(string => address) private superAdmin;
    mapping(address => Profiles) private profile;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender == admin) {
            revert NotAdmin();
        }
        _;
    }

    function addSuperAdmin(
        address _superAdmin,
        string memory _neighborhood
    ) public onlyAdmin {
        superAdmin[_neighborhood] = _superAdmin;
    }

    function registerTitle(
        string memory _state,
        string memory _district,
        string memory _neighborhood,
        uint256 _surveyNumber,
        address payable _ownerAddress,
        uint256 _marketValue,
        uint256 id
    ) public returns (bool) {
        if (superAdmin[_neighborhood] != msg.sender) {
            revert OwnerMustBeFromTheSameNeighborhood(
                msg.sender,
                _neighborhood
            );
        }

        if (admin != msg.sender) {
            revert NotAdmin();
        }

        if (_marketValue <= 0) {
            revert PriceMustBeAboveZero();
        }
        land[id].state = _state;
        land[id].district = _district;
        land[id].neighborhood = _neighborhood;
        land[id].surveyNumber = _surveyNumber;
        land[id].currentOwner = _ownerAddress;
        land[id].marketValue = _marketValue;
        profile[_ownerAddress].assetList.push(id);

        emit PropertyListed(
            land[id].currentOwner,
            land[id].surveyNumber,
            land[id].marketValue
        );
        return true;
    }

    function landInfoOwner(
        uint256 id
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            bool,
            address,
            ReqStatus
        )
    {
        return (
            land[id].state,
            land[id].district,
            land[id].neighborhood,
            land[id].surveyNumber,
            land[id].isAvailable,
            land[id].requester,
            land[id].requestStatus
        );
    }

    function landInfoUser(
        uint256 id
    ) public view returns (address, uint256, bool, address, ReqStatus) {
        return (
            land[id].currentOwner,
            land[id].marketValue,
            land[id].isAvailable,
            land[id].requester,
            land[id].requestStatus
        );
    }

    function generateId(
        string memory _state,
        string memory _district,
        string memory _neighborhood,
        uint256 _surveyNumber
    ) public view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        _state,
                        _district,
                        _neighborhood,
                        _surveyNumber
                    )
                )
            ) % 10000000000000;
    }

    function requestToLandOwner(uint256 id) public {
        require(land[id].isAvailable, "No se encuentra disponible");
        land[id].requester = msg.sender;
        land[id].isAvailable = false;
        land[id].requestStatus = ReqStatus.PENDING;
    }

    function viewAssets() external view returns (uint256[] memory) {
        return (profile[msg.sender].assetList);
    }

    function viewRequest(uint256 property) public view returns (address) {
        return (land[property].requester);
    }

    function processRequest(uint256 property, ReqStatus status) public {
        if (land[property].currentOwner == msg.sender) {
            revert NotOwner();
        }

        land[property].requestStatus = status;
        if (status == ReqStatus.REJECTED) {
            land[property].requester = address(0);
            land[property].requestStatus = ReqStatus.DEFAULT;
        }
    }

    function makeAvailable(uint256 property) public {
        if (land[property].currentOwner == msg.sender) {
            revert NotOwner();
        }
        land[property].isAvailable = true;
    }

    function buyProperty(uint256 property) external payable nonReentrant {
        if (land[property].requestStatus == ReqStatus.APPROVED) {
            revert NotApprovedByOwner();
        }
        if (
            msg.value >=
            (land[property].marketValue + ((land[property].marketValue) / 10))
        ) {
            revert PriceNotMet(
                land[property].surveyNumber,
                land[property].marketValue
            );
        }

        land[property].currentOwner.transfer(land[property].marketValue);

        emit PropertyBought(
            msg.sender,
            land[property].surveyNumber,
            land[property].marketValue
        );
    }

    function removeOwnership(address previousOwner, uint256 id) private {
        uint256 index = findId(id, previousOwner);
        profile[previousOwner].assetList[index] = profile[previousOwner]
            .assetList[profile[previousOwner].assetList.length - 1];
        profile[previousOwner].assetList.pop();
    }

    function findId(uint256 id, address user) public view returns (uint256) {
        uint256 i;
        for (i = 0; i < profile[user].assetList.length; i++) {
            if (profile[user].assetList[i] == id) return i;
        }
        return i;
    }
}
