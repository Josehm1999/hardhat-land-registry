// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TitleRegistry is ReentrancyGuard {
    error PriceMustBeAboveZero();
    // error NotApprovedForSystem();
    error NotApprovedByOwner();
    error PropertyAlreadyRegistered(uint256 id);
    error NotOwner();

    error NotAdmin();
    // error NotListed(address titleAddress, uint256 tokenId);
    // error NoProceeds();
    error PropertyIsNotRegistered(uint256 id);

    error MustBeRegionalAdminAndFromSameDistrict(
        address owner,
        string district
    );

    error AdminAlreadyRegisteredForDistrict(
        address regionalAdmin,
        string district
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

    event RegionalAdminCreated(address indexed regionalAdmin, string district);

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
    mapping(string => address) private regionalAdmin;
    mapping(address => Profiles) private profile;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert NotAdmin();
        }
        _;
    }

    function addRegionalAdmin(address _regionalAdmin, string memory _district)
        public
        onlyAdmin
    {
        if (regionalAdmin[_district] != address(0)) {
            revert AdminAlreadyRegisteredForDistrict(_regionalAdmin, _district);
        }
        regionalAdmin[_district] = _regionalAdmin;
        emit RegionalAdminCreated(_regionalAdmin, _district);
    }

    function registerTitle(
        string memory _state,
        string memory _district,
        string memory _neighborhood,
        uint256 _surveyNumber,
        address payable _ownerAddress,
        uint256 _marketValue
    ) public returns (bool) {
        if (regionalAdmin[_district] != msg.sender) {
            revert MustBeRegionalAdminAndFromSameDistrict(
                msg.sender,
                _district
            );
        }

        if (land[_surveyNumber].surveyNumber != 0) {
            revert PropertyAlreadyRegistered(_surveyNumber);
        }

        if (_marketValue <= 0) {
            revert PriceMustBeAboveZero();
        }

        land[_surveyNumber].state = _state;
        land[_surveyNumber].district = _district;
        land[_surveyNumber].neighborhood = _neighborhood;
        land[_surveyNumber].surveyNumber = _surveyNumber;
        land[_surveyNumber].currentOwner = _ownerAddress;
        land[_surveyNumber].marketValue = _marketValue;
        profile[_ownerAddress].assetList.push(_surveyNumber);

        emit PropertyListed(
            land[_surveyNumber].currentOwner,
            _surveyNumber,
            land[_surveyNumber].marketValue
        );
        return true;
    }

    function landInfoOwner(uint256 surveyNumber)
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
        if (land[surveyNumber].surveyNumber == 0) {
            revert PropertyIsNotRegistered(surveyNumber);
        }

        return (
            land[surveyNumber].state,
            land[surveyNumber].district,
            land[surveyNumber].neighborhood,
            land[surveyNumber].surveyNumber,
            land[surveyNumber].isAvailable,
            land[surveyNumber].requester,
            land[surveyNumber].requestStatus
        );
    }

    function landInfoUser(uint256 surveyNumber)
        public
        view
        returns (
            address,
            uint256,
            bool,
            address,
            ReqStatus
        )
    {
        if (land[surveyNumber].surveyNumber != 0) {
            revert PropertyIsNotRegistered(surveyNumber);
        }
        return (
            land[surveyNumber].currentOwner,
            land[surveyNumber].marketValue,
            land[surveyNumber].isAvailable,
            land[surveyNumber].requester,
            land[surveyNumber].requestStatus
        );
    }

    function requestToLandOwner(uint256 surveyNumber) public {
        require(land[surveyNumber].isAvailable, "No se encuentra disponible");
        land[surveyNumber].requester = msg.sender;
        land[surveyNumber].isAvailable = false;
        land[surveyNumber].requestStatus = ReqStatus.PENDING;
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

    function removeOwnership(address previousOwner, uint256 surveyNumber)
        private
    {
        uint256 index = findId(surveyNumber, previousOwner);
        profile[previousOwner].assetList[index] = profile[previousOwner]
            .assetList[profile[previousOwner].assetList.length - 1];
        profile[previousOwner].assetList.pop();
    }

    function findId(uint256 surveyNumber, address user)
        public
        view
        returns (uint256)
    {
        uint256 i;
        for (i = 0; i < profile[user].assetList.length; i++) {
            if (profile[user].assetList[i] == surveyNumber) return i;
        }
        return i;
    }
}
