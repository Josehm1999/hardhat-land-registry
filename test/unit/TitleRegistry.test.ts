import { network, deployments, ethers } from 'hardhat';
import { assert, expect } from 'chai';
import { Signer } from 'ethers';
import { developmentChains } from '../../helper-hardhat-config';
import { TitleRegistry } from '../../typechain-types';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Title Registry Unit Tests', function () {
      let titleregistry: TitleRegistry, titleregistryContract: TitleRegistry;
      const PRICE = ethers.utils.parseEther('0.6');
      let deployer: Signer;
      let seller: Signer;
      let buyer: Signer;
      let regionalAdmin: Signer;

      beforeEach(async () => {
        const accounts = await ethers.getSigners(); // tambien se podria hacer con getNamedAccounts
        deployer = accounts[0];
        seller = accounts[1];
        buyer = accounts[2];
        regionalAdmin = accounts[3];
        await deployments.fixture(['all']);
        titleregistryContract = await ethers.getContract('TitleRegistry');
        titleregistry = titleregistryContract.connect(deployer);
        titleregistry.addRegionalAdmin(
          regionalAdmin.getAddress(),
          'Miraflores'
        );
      });

      describe('registerRegionalAdmin', function () {
        it('Solo el usuario superAdmin puede generar Admin. regionales', async function () {
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.addRegionalAdmin(
              await regionalAdmin.getAddress(),
              'Santiago de Surco'
            )
          ).to.be.revertedWithCustomError(titleregistry, 'NotAdmin');
        });

        it('Solo puede haber un usario Admin regional por distrito', async function () {
          await expect(
            titleregistry.addRegionalAdmin(
              await regionalAdmin.getAddress(),
              'Miraflores'
            )
          ).to.be.revertedWithCustomError(
            titleregistry,
            'AdminAlreadyRegisteredForDistrict'
          );
        });

        it('Se genera correctamente un Admin regional', async function () {
          await expect(
            titleregistryContract.addRegionalAdmin(
              await regionalAdmin.getAddress(),
              'Santiago de Surco'
            )
          ).to.emit(titleregistry, 'RegionalAdminCreated');
        });
      });

      describe('registerProperty', function () {
        it('Se genera correctamente el registro de una nueva propiedad y se emite un evento', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await expect(
            titleregistry.registerTitle(
              'Lima',
              'Miraflores',
              'Miraflores',
              12467674889,
              seller.getAddress(),
              1.0
            )
          ).to.emit(titleregistry, 'PropertyListed');
        });

        it('Solo el Admin regional del distrito asignado puede registrar una nueva propiedad', async function () {
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.registerTitle(
              'Lima',
              'Surco',
              'Miraflores',
              12467674889,
              seller.getAddress(),
              1.0
            )
          ).to.be.revertedWithCustomError(
            titleregistry,
            'MustBeRegionalAdminAndFromSameDistrict'
          );
        });

        it('No se puede registrar una propiedad con el mismo número de partida registral dos veces', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            3.0
          );

          await expect(
            titleregistry.registerTitle(
              'Lima',
              'Miraflores',
              'Miraflores',
              12467674889,
              seller.getAddress(),
              1.0
            )
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PropertyAlreadyRegistered'
          );
        });

        it('No se puede registrar una propiedad con precio 0', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await expect(
            titleregistry.registerTitle(
              'Lima',
              'Miraflores',
              'Miraflores',
              12467674889,
              seller.getAddress(),
              0.0
            )
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PriceMustBeAboveZero'
          );
        });
      });

      describe('findProperty', function () {
        it('No existe la una propiedad con el número de partida registral brindado- Información para dueños', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          await expect(
            titleregistry.landInfoOwner(12467674888)
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PropertyIsNotRegistered'
          );
        });

        it('No existe la una propiedad con el número de partida registral brindado - Información para usuarios', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.landInfoUser(12467674888)
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PropertyIsNotRegistered'
          );
        });
      });

      describe('makeAvailable', function () {
        it('Se emite un evento cuando el dueño de una propiedad cambia su disponibilidad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await expect(titleregistry.makeAvailable(12467674889)).to.emit(
            titleregistry,
            'PropertyChangedAvailability'
          );
        });
        it('Solo el dueño de una propiedad puede cambiar su disponibilidad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.makeAvailable(12467674889)
          ).to.be.revertedWithCustomError(titleregistry, 'NotOwner');
        });
      });

      describe('makeUnavailable', function () {
        it('Se emite un evento cuando el dueño de una propiedad cambia su disponibilidad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          titleregistry.processRequest(12467674889, 2);
          await expect(titleregistry.makeUnavailable(12467674889)).to.emit(
            titleregistry,
            'PropertyChangedAvailability'
          );
        });
        it('Solo el dueño de una propiedad puede cambiar su disponibilidad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.makeUnavailable(12467674889)
          ).to.be.revertedWithCustomError(titleregistry, 'NotOwner');
        });
        it('No se puede cambiar la disponibilidad de una propiedad si se encuentra involucrada en una transacción', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          await expect(
            titleregistry.makeUnavailable(12467674889)
          ).to.be.revertedWithCustomError(
            titleregistry,
            'RejectRequestBeforeChangingAvailability'
          );
        });
      });
      describe('requestToLandOwner', function () {
        it('Se emite un evento al realizar una solicitud de compra al dueño de una propiedad que se encuentra disponible', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await expect(titleregistry.requestToLandOwner(12467674889)).to.emit(
            titleregistry,
            'PropertyRequestStatusChanged'
          );
        });
        it('No se puede realizar solicitudes de compra a propiedades que no esten disponibles', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.requestToLandOwner(12467674889)
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PropertyNotAvailable'
          );
        });
      });

      describe('processRequest', function () {
        it('Se emite un evento al realizar una solicitud de compra al dueño de una propiedad que se encuentra disponible', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          await expect(titleregistry.processRequest(12467674889, 3)).to.emit(
            titleregistry,
            'PropertyRequestStatusChanged'
          );
        });
        it('Solo se pueden procesar solicitudes de compra que se encuentren en estado pendiente (PENDING))', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          await expect(
            titleregistry.processRequest(12467674889, 3)
          ).to.be.revertedWithCustomError(titleregistry, 'NotOwner');
        });
      });

      describe('buyProperty', function () {
        it('Se emite un evento al completar una transacción de compra exitosamente.', async function () {
          const PRICE_WITH_TAX = ethers.utils
            .parseEther('0.6')
            .add(ethers.utils.parseEther('0.06'));
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.processRequest(12467674889, 3);
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.buyProperty(12467674889, { value: PRICE_WITH_TAX })
          ).to.emit(titleregistry, 'PropertyBought');

          const proceeds = await titleregistry.getProceeds(seller.getAddress());
          const currentOwner = await titleregistry.landInfoUser(12467674889);
          assert(proceeds.toString() == PRICE_WITH_TAX.toString());
          assert(currentOwner[0] == (await buyer.getAddress()));
        });

        it('Solo el usuario que realizó la solicitud de compra puede finalizar la transacción', async function () {
          const PRICE_WITH_TAX = ethers.utils
            .parseEther('0.6')
            .add(ethers.utils.parseEther('0.06'));
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.processRequest(12467674889, 3);
          titleregistry = titleregistryContract.connect(deployer);
          await expect(
            titleregistry.buyProperty(12467674889, { value: PRICE_WITH_TAX })
          ).to.be.revertedWithCustomError(
            titleregistry,
            'MustBeUserWhoMadeTheInitialRequest'
          );
        });
        it('Solo se puede completar una compra que haya sido aprovada por el dueño de la propiedad', async function () {
          const PRICE_WITH_TAX = ethers.utils
            .parseEther('0.6')
            .add(ethers.utils.parseEther('0.06'));
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.processRequest(12467674889, 0);
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.buyProperty(12467674889, { value: PRICE_WITH_TAX })
          ).to.be.revertedWithCustomError(titleregistry, 'NotApprovedByOwner');
        });

        it('Solo se puede completar una compra si el monto ofrecido es mayor a la suma del valor de la propiedad y del impuesto correspondiente', async function () {
          const PRICE_WITH_TAX = ethers.utils
            .parseEther('0.5')
            .add(ethers.utils.parseEther('0.06'));
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.processRequest(12467674889, 3);
          titleregistry = titleregistryContract.connect(buyer);
          await expect(
            titleregistry.buyProperty(12467674889, { value: PRICE_WITH_TAX })
          ).to.be.revertedWithCustomError(titleregistry, 'PriceNotMet');
        });
      });

      describe('withDrawProceeds', function () {
        it('No se puede retirar fondos si la cuenta tiene 0 fondos', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);
          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);
          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.processRequest(12467674889, 3);
          await expect(
            titleregistry.withDrawProceeds()
          ).to.be.revertedWithCustomError(titleregistry, 'NoProceeds');
        });

        it('Se retira la misma cantidad obtenida por la transacción de compra de propiedad', async function () {
          const PRICE_WITH_TAX = ethers.utils
            .parseEther('0.6')
            .add(ethers.utils.parseEther('0.06'));

          titleregistry = titleregistryContract.connect(regionalAdmin);

          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );

          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.makeAvailable(12467674889);

          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.requestToLandOwner(12467674889);

          titleregistry = titleregistryContract.connect(seller);
          await titleregistry.processRequest(12467674889, 3);

          titleregistry = titleregistryContract.connect(buyer);
          await titleregistry.buyProperty(12467674889, {
            value: PRICE_WITH_TAX,
          });

          const sellerProceedsBefore = await titleregistry.getProceeds(
            await seller.getAddress()
          );

          const sellerBalanceBefore = await seller.getBalance();

          titleregistry = titleregistryContract.connect(seller);

          const txResponse = await titleregistry.withDrawProceeds();
          const transactionReceipt = await txResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const sellerBalanceAfter = await seller.getBalance();

          assert(
            sellerBalanceAfter.add(gasCost).toString() ==
              sellerProceedsBefore.add(sellerBalanceBefore).toString()
          );
        });
      });
      describe('updateTitleRegistry', function () {
        it('Se genera un evento al actualizar correctamente el registro de una propiedad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);

          const NEW_PRICE = ethers.utils
            .parseEther('0.6')
            .add(ethers.utils.parseEther('0.06'));

          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(seller);

          await expect(
            titleregistry.updateTitleRegistry(12467674889, NEW_PRICE)
          ).be.emit(titleregistry, 'PropertyListed');

          const listing = await titleregistry.landInfoUser(12467674889);
          assert(listing[1].toString() == NEW_PRICE.toString());
        });

        it('Solo el dueño de la propiedad puede actualizarla', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);

          const NEW_PRICE = ethers.utils
            .parseEther('0.6')
            .add(ethers.utils.parseEther('0.06'));

          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          );
          titleregistry = titleregistryContract.connect(buyer);

          await expect(
            titleregistry.updateTitleRegistry(12467674889, NEW_PRICE)
          ).to.be.revertedWithCustomError(titleregistry, 'NotOwner');
        });

        it('Se genera un evento al actualizar correctamente el registro de una propiedad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin);

          const NEW_PRICE = ethers.utils
            .parseEther('0.6')
            .add(ethers.utils.parseEther('0.06'));

          titleregistry = titleregistryContract.connect(seller);
          await expect(
            titleregistry.updateTitleRegistry(12467674889, NEW_PRICE)
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PropertyIsNotRegistered'
          );
        });
      });
    });

