import { network, deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { Signer } from 'ethers'
import { developmentChains } from '../../helper-hardhat-config'
import { TitleRegistry } from '../../typechain-types'

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Title Registry Unit Tests', function () {
      let titleregistry: TitleRegistry, titleregistryContract: TitleRegistry
      const PRICE = ethers.utils.parseEther('0.6')
      let deployer: Signer
      let seller: Signer
      let buyer: Signer
      let regionalAdmin: Signer

      beforeEach(async () => {
        const accounts = await ethers.getSigners() // tambien se podria hacer con getNamedAccounts
        deployer = accounts[0]
        seller = accounts[1]
        buyer = accounts[2]
        regionalAdmin = accounts[3]
        await deployments.fixture(['all'])
        titleregistryContract = await ethers.getContract('TitleRegistry')
        titleregistry = titleregistryContract.connect(deployer)
        titleregistry.addRegionalAdmin(regionalAdmin.getAddress(), 'Miraflores')
      })

      describe('registerRegionalAdmin', function () {
        it('Solo el usuario superAdmin puede generar Admin. regionales', async function () {
          titleregistry = titleregistryContract.connect(buyer)
          await expect(
            titleregistry.addRegionalAdmin(
              await regionalAdmin.getAddress(),
              'Santiago de Surco'
            )
          ).to.be.revertedWithCustomError(titleregistry, 'NotAdmin')
        })

        it('Solo puede haber un usario Admin regional por distrito', async function () {
          await expect(
            titleregistry.addRegionalAdmin(
              await regionalAdmin.getAddress(),
              'Miraflores'
            )
          ).to.be.revertedWithCustomError(
            titleregistry,
            'AdminAlreadyRegisteredForDistrict'
          )
        })

        it('Se genera correctamente un Admin regional', async function () {
          await expect(
            titleregistryContract.addRegionalAdmin(
              await regionalAdmin.getAddress(),
              'Santiago de Surco'
            )
          ).to.emit(titleregistry, 'RegionalAdminCreated')
        })
      })

      describe('registerProperty', function () {
        it('Se genera correctamente el registro de una nueva propiedad y se emite un evento', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await expect(
            titleregistry.registerTitle(
              'Lima',
              'Miraflores',
              'Miraflores',
              12467674889,
              seller.getAddress(),
              1.0
            )
          ).to.emit(titleregistry, 'PropertyListed')
        })

        it('Solo el Admin regional del distrito asignado puede registrar una nueva propiedad', async function () {
          titleregistry = titleregistryContract.connect(buyer)
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
          )
        })

        it('No se puede registrar una propiedad con el mismo número de partida registral dos veces', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            3.0
          )

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
          )
        })

        it('No se puede registrar una propiedad con precio 0', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await expect(
            titleregistry.registerTitle(
              'Lima',
              'Miraflores',
              'Miraflores',
              12467674889,
              seller.getAddress(),
              0.0
            )
          ).to.be.revertedWithCustomError(titleregistry, 'PriceMustBeAboveZero')
        })
      })

      describe('updateTitleRegistry', function (){})

      describe('findProperty', function () {
        it('No existe la una propiedad con el número de partida registral brindado- Información para dueños', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          await expect(
            titleregistry.landInfoOwner(12467674888)
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PropertyIsNotRegistered'
          )
        })

        it('No existe la una propiedad con el número de partida registral brindado - Información para usuarios', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(buyer)
          await expect(
            titleregistry.landInfoUser(12467674888)
          ).to.be.revertedWithCustomError(
            titleregistry,
            'PropertyIsNotRegistered'
          )
        })
      })

      describe('makeAvailable', function () {
        it('Se emite un evento cuando el dueño de una propiedad cambia su disponibilidad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(seller)
          await expect(titleregistry.makeAvailable(12467674889)).to.emit(
            titleregistry,
            'PropertyChangedAvailability'
          )
        })
        it('Solo el dueño de una propiedad puede cambiar su disponibilidad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(buyer)
          await expect(
            titleregistry.makeAvailable(12467674889)
          ).to.be.revertedWithCustomError(titleregistry, 'NotOwner')
        })
      })

      describe('makeUnavailable', function () {

      })
      describe('requestToLandOwner', function () {
        it('Se emite un evento al realizar una solicitud de compra al dueño de una propiedad que se encuentra disponible', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(seller)
          await titleregistry.makeAvailable(12467674889)
          titleregistry = titleregistryContract.connect(buyer)
          await expect(titleregistry.requestToLandOwner(12467674889)).to.emit(
            titleregistry,
            'PropertyStatusChanged'
          )
        })
        it('No se puede realizar solicitudes de compra a propiedades que no esten disponibles', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(buyer)
          await expect(
            titleregistry.requestToLandOwner(12467674889)
          ).to.be.revertedWithCustomError(titleregistry, 'PropertyNotAvailable')
        })
      })

      describe('processRequest', function () {
        it('Se emite un evento al realizar una solicitud de compra al dueño de una propiedad que se encuentra disponible', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(seller)
          await titleregistry.makeAvailable(12467674889)
          titleregistry = titleregistryContract.connect(buyer)
          await titleregistry.requestToLandOwner(12467674889)
          titleregistry = titleregistryContract.connect(seller)
          await expect(titleregistry.processRequest(12467674889, 3)).to.emit(
            titleregistry,
            'PropertyStatusChanged'
          )
        })
        it('Solo se pueden procesar solicitudes de compra que se encuentren en estado pendiente (PENDING))', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(seller)
          await titleregistry.makeAvailable(12467674889)
          titleregistry = titleregistryContract.connect(buyer)
          await titleregistry.requestToLandOwner(12467674889)
          await expect(
            titleregistry.processRequest(12467674889, 3)
          ).to.be.revertedWithCustomError(titleregistry, 'NotOwner')
        })
      })

      describe('buyProperty', function () {
        it('Se emite un evento al completar una transacción de compra exitosamente.', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(seller)
          await titleregistry.makeAvailable(12467674889)
          titleregistry = titleregistryContract.connect(buyer)
          await titleregistry.requestToLandOwner(12467674889)
          titleregistry = titleregistryContract.connect(seller)
          await titleregistry.processRequest(12467674889, 3)
          titleregistry = titleregistryContract.connect(buyer)
          await expect(titleregistry.buyProperty(12467674889)).to.emit(
            titleregistry,
            'PropertyBought'
          )
        })
        it('Solo se pueden completar una compra que haya sido aprovada por el dueño de la propiedad', async function () {
          titleregistry = titleregistryContract.connect(regionalAdmin)
          await titleregistry.registerTitle(
            'Lima',
            'Miraflores',
            'Miraflores',
            12467674889,
            seller.getAddress(),
            PRICE
          )
          titleregistry = titleregistryContract.connect(seller)
          await titleregistry.makeAvailable(12467674889)
          titleregistry = titleregistryContract.connect(buyer)
          await titleregistry.requestToLandOwner(12467674889)
          titleregistry = titleregistryContract.connect(seller)
          await titleregistry.processRequest(12467674889, 0)
          titleregistry = titleregistryContract.connect(buyer)
          await expect(
            titleregistry.buyProperty(12467674889)
          ).to.be.revertedWithCustomError(titleregistry, 'NotApprovedByOwner')
        })

        it('', async function (){})
        it('', async function (){})
      })


      describe('withDrawProceeds', function (){
      })

      describe('removeOwnership', function() {

      })

    })

//     it('Actualiza los listados de los titulos con el vendedor y el precio', async function() {
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         const listing = await titleregistry.getListing(
//             basicNft.address,
//             TOKEN_ID
//         );
//         assert(listing.price.toString() == PRICE.toString());
//         assert(listing.seller.toString() == (await deployer.getAddress()));
//     });
// });
// describe('cancelListing', function() {
//     it('Si no hay listado revierte la operación (revert)', async function() {
//         // const error = `El titulo no esta listado ("${basicNft.address}", ${TOKEN_ID})`;
//         await expect(
//             titleregistry.cancelListing(basicNft.address, TOKEN_ID)
//         ).to.be.revertedWithCustomError(titleregistry, 'NotListed');
//     });
//
//     it('Si otro usuario que no es el dueño trata de listar un titulo revierte la operación (revert)', async function() {
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         titleregistry = titleregistryContract.connect(user);
//         await basicNft.approve(await user.getAddress(), TOKEN_ID);
//         await expect(
//             titleregistry.cancelListing(basicNft.address, TOKEN_ID)
//         ).to.be.revertedWithCustomError(titleregistry, 'NotOwner');
//     });
//
//     it('Emite un evento y quita el titulo del listado', async function() {
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         expect(
//             await titleregistry.cancelListing(basicNft.address, TOKEN_ID)
//         ).to.emit(titleregistry, 'Listado del titulo cancelado');
//         const listing = await titleregistry.getListing(
//             basicNft.address,
//             TOKEN_ID
//         );
//         assert(listing.price.toString() == '0');
//     });
// });
// describe('buyTitle', function() {
//     it('Revierte la operación si el titulo no esta listado.', async function() {
//         await expect(
//             titleregistry.buyTitle(basicNft.address, TOKEN_ID)
//         ).to.be.revertedWithCustomError(titleregistry, 'NotListed');
//     });
//     it('Revertir si el precio no se cumple', async function() {
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         await expect(
//             titleregistry.buyTitle(basicNft.address, TOKEN_ID)
//         ).to.be.revertedWithCustomError(titleregistry, 'PriceNotMet');
//     });
//     it('Transfiere el titulo al comprador y actualiza el registro interno de las transacciones', async function() {
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         titleregistry = titleregistryContract.connect(user);
//         expect(
//             await titleregistry.buyTitle(basicNft.address, TOKEN_ID, {
//                 value: PRICE,
//             })
//         ).to.emit(titleregistry, 'Titulo comprado');
//         const newOwner = await basicNft.ownerOf(TOKEN_ID);
//         const deployerProceeds = await titleregistry.getProceeds(
//             await deployer.getAddress()
//         );
//         assert(newOwner.toString() == (await user.getAddress()));
//         assert(deployerProceeds.toString() == PRICE.toString());
//     });
// });
// describe('updateListings', function() {
//     it('Debe de ser dueño del titulo y el titulo estar listado', async function() {
//         await expect(
//             titleregistry.updateListings(basicNft.address, TOKEN_ID, PRICE)
//         ).to.be.revertedWithCustomError(titleregistry, 'NotListed');
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         titleregistry = titleregistryContract.connect(user);
//         await expect(
//             titleregistry.updateListings(basicNft.address, TOKEN_ID, PRICE)
//         ).to.be.revertedWithCustomError(titleregistry, 'NotOwner');
//     });
//     it('Actualiza el precio de un titulo de propiedad', async function() {
//         const updatedPrice = ethers.utils.parseEther('0.2');
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         expect(
//             await titleregistry.updateListings(
//                 basicNft.address,
//                 TOKEN_ID,
//                 updatedPrice
//             )
//         ).to.emit(titleregistry, 'TitleListed');
//         const listing = await titleregistry.getListing(
//             basicNft.address,
//             TOKEN_ID
//         );
//         assert(listing.price.toString() == updatedPrice.toString());
//     });
// });
// describe('withdrawProceeds', function() {
//     it('No permite retiros al no tener fondos', async function() {
//         await expect(
//             titleregistry.withDrawProceeds()
//         ).to.be.revertedWithCustomError(titleregistry, 'NoProceeds');
//     });
//     it('Retirar balance', async function() {
//         await titleregistry.listTitle(basicNft.address, TOKEN_ID, PRICE);
//         titleregistry = titleregistryContract.connect(user);
//         await titleregistry.buyTitle(basicNft.address, TOKEN_ID, {
//             value: PRICE,
//         });
//         titleregistry = titleregistryContract.connect(deployer);
//
//         const deployerProceedsBefore = await titleregistry.getProceeds(
//             await deployer.getAddress()
//         );
//         const deployerBalanceBefore = await deployer.getBalance();
//         const txResponse = await titleregistry.withDrawProceeds();
//         const transactionReceipt = await txResponse.wait(1);
//         const { gasUsed, effectiveGasPrice } = transactionReceipt;
//         const gasCost = gasUsed.mul(effectiveGasPrice);
//         const deployerBalanceAfter = await deployer.getBalance();
//
//         assert(
//             deployerBalanceAfter.add(gasCost).toString() ==
//             deployerProceedsBefore.add(deployerBalanceBefore).toString()
//         );
//     });
