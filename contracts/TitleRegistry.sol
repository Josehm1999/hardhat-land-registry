// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TitleRegistry is ReentrancyGuard {
    error PriceMustBeAboveZero();
    // error NotApprovedForSystem();
    error NotApprovedByOwner();
    error PropertyNotAvailable();
    error PropertyAlreadyRegistered(uint256 id);
    error NotOwner();
    error NotAdmin();
    // error NotListed(address titleAddress, uint256 tokenId);
    error MustBeUserWhoMadeTheInitialRequest();
    error RejectRequestBeforeChangingAvailability();
    error NoProceeds();
    error PropertyIsNotRegistered(uint256 id);
    error TransferFailed();
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
        string state,
        string district,
        string neighborhood,
        uint256 indexed surveyNumber,
        address indexed seller,
        uint256 marketValue,
        bool isAvailable,
        ReqStatus
    );

    event PropertyBought(
        address indexed seller,
        address indexed buyer,
        uint256 indexed surveyNumber,
        uint256 marketValue
    );

    event PropertyRequestStatusChanged(
        uint256 indexed surveyNumber,
        address indexed seller,
        ReqStatus
    );
    event PropertyChangedAvailability(
        uint256 indexed surveyNumber,
        address indexed seller,
        bool isAvailable
    );
    event TransactionCanceled(
        uint256 indexed surveyNumber,
        address indexed seller
    );

    event RegionalAdminCreated(address indexed regionalAdmin, string district);

    // Estructura de un titulo de propiedad
    struct TitleDetails {
        string state;
        string district;
        string neighborhood;
        uint256 surveyNumber;
        address currentOwner;
        uint256 marketValue;
        bool isAvailable;
        address requester;
        ReqStatus requestStatus;
    }

    receive() external payable {}

    // to support receiving ETH by default

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
    mapping(address => uint256) private s_proceeds;

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
            land[_surveyNumber].state,
            land[_surveyNumber].district,
            land[_surveyNumber].neighborhood,
            _surveyNumber,
            land[_surveyNumber].currentOwner,
            land[_surveyNumber].marketValue,
            land[_surveyNumber].isAvailable,
            land[_surveyNumber].requestStatus
        );
        return true;
    }

    function updateTitleRegistry(uint256 _surveyNumber, uint256 _marketValue)
        external
    {
        if (land[_surveyNumber].surveyNumber == 0) {
            revert PropertyIsNotRegistered(_surveyNumber);
        }

        if (land[_surveyNumber].currentOwner != msg.sender) {
            revert NotOwner();
        }

        land[_surveyNumber].marketValue = _marketValue;
        emit PropertyListed(
            land[_surveyNumber].state,
            land[_surveyNumber].district,
            land[_surveyNumber].neighborhood,
            _surveyNumber,
            land[_surveyNumber].currentOwner,
            land[_surveyNumber].marketValue,
            land[_surveyNumber].isAvailable,
            land[_surveyNumber].requestStatus
        );
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
        if (land[surveyNumber].surveyNumber == 0) {
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
        if (!land[surveyNumber].isAvailable) {
            revert PropertyNotAvailable();
        }
        land[surveyNumber].requester = msg.sender;
        land[surveyNumber].isAvailable = false;
        land[surveyNumber].requestStatus = ReqStatus.PENDING;
        emit PropertyRequestStatusChanged(
            surveyNumber,
            land[surveyNumber].currentOwner,
            ReqStatus.PENDING
        );
    }

    function viewAssets() external view returns (uint256[] memory) {
        return (profile[msg.sender].assetList);
    }

    function viewRequest(uint256 property) public view returns (address) {
        return (land[property].requester);
    }

    function processRequest(uint256 surveyNumber, ReqStatus status) public {
        if (land[surveyNumber].currentOwner != msg.sender) {
            revert NotOwner();
        }

        land[surveyNumber].requestStatus = status;
        emit PropertyRequestStatusChanged(
            surveyNumber,
            land[surveyNumber].currentOwner,
            status
        );
        if (status == ReqStatus.REJECTED) {
            land[surveyNumber].requester = address(0);
            land[surveyNumber].requestStatus = ReqStatus.DEFAULT;
            emit TransactionCanceled(
                surveyNumber,
                land[surveyNumber].currentOwner
            );
        }
    }

    function makeAvailable(uint256 surveyNumber) public {
        if (land[surveyNumber].currentOwner != msg.sender) {
            revert NotOwner();
        }
        land[surveyNumber].isAvailable = true;
        emit PropertyChangedAvailability(
            surveyNumber,
            land[surveyNumber].currentOwner,
            true
        );
    }

    function makeUnavailable(uint256 surveyNumber) public {
        if (land[surveyNumber].currentOwner != msg.sender) {
            revert NotOwner();
        }

        if (land[surveyNumber].requestStatus == ReqStatus.PENDING) {
            revert RejectRequestBeforeChangingAvailability();
        }

        land[surveyNumber].isAvailable = false;
        emit PropertyChangedAvailability(
            surveyNumber,
            land[surveyNumber].currentOwner,
            false
        );
    }

    function buyProperty(uint256 surveyNumber) external payable nonReentrant {
        if (land[surveyNumber].requestStatus != ReqStatus.APPROVED) {
            revert NotApprovedByOwner();
        }
        if (
            msg.value <
            (land[surveyNumber].marketValue +
                ((land[surveyNumber].marketValue) / 10))
        ) {
            revert PriceNotMet(
                land[surveyNumber].surveyNumber,
                land[surveyNumber].marketValue
            );
        }
        // No se le envía directamente el dinero al vendedor
        // https://github.com/fravoll/solidity-patterns/blob/master/docs/pull_over_push.md

        // Enviar el dinero al usuario ❌
        // Hacer que tengan que retirar el dinero ✅

        // address payable Owner = land[surveyNumber].currentOwner;
        // Owner.transfer(
        //     land[surveyNumber].marketValue
        // );

        if (land[surveyNumber].requester != msg.sender) {
            revert MustBeUserWhoMadeTheInitialRequest();
        }

        s_proceeds[land[surveyNumber].currentOwner] += msg.value;

        removeOwnership(land[surveyNumber].currentOwner, surveyNumber);
        land[surveyNumber].isAvailable = false;
        land[surveyNumber].requester = address(0);
        land[surveyNumber].requestStatus = ReqStatus.DEFAULT;
        profile[msg.sender].assetList.push(surveyNumber); //adds the property to the asset list of the new owner.

        emit PropertyBought(
            land[surveyNumber].currentOwner,
            msg.sender,
            land[surveyNumber].surveyNumber,
            land[surveyNumber].marketValue
        );

        land[surveyNumber].currentOwner = msg.sender;
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

    function withDrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];

        if (proceeds <= 0) {
            revert NoProceeds();
        }

        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
