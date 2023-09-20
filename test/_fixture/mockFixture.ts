import { Fixture } from 'ethereum-waffle'
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { defaultAbiCoder } from "@ethersproject/abi";
import { ethers } from 'hardhat'
import {
	MockERC20,
	JumpRateModelV2,
	Comptroller,
	CErc20Delegate,
	PriceOracleRouter,
	SimplePriceOracle,
	Comp,
	VestingVault,
	GovernorBravoDelegate,
	Timelock
} from '../../typechain'

export interface Contracts {
	rwa1: MockERC20;
	rwa2: MockERC20;
	rwa3: MockERC20;
	note: MockERC20;
	Comptroller: Comptroller;
	cRwa1: CErc20Delegate;
	cRwa2: CErc20Delegate;
	cRwa3: CErc20Delegate;
	cNote: CErc20Delegate;
	ccNote: CErc20Delegate;
	interestModel: JumpRateModelV2;
	router: PriceOracleRouter;
	oracle1: SimplePriceOracle;
	oracle2: SimplePriceOracle;
	comp: Comp;
	vesting: VestingVault;
	gov: GovernorBravoDelegate;
	timelock: Timelock
}

const mockFixture: Fixture<Contracts> = async () => {
	const [deployer, user1] = await ethers.getSigners();

	const MockERC20Factory = await ethers.getContractFactory('MockERC20');
	const JumpRateModelV2Factory = await ethers.getContractFactory('JumpRateModelV2');
	const UnitrollerFactory = await ethers.getContractFactory('Unitroller');
	const ComptrollerFactory = await ethers.getContractFactory('Comptroller');
	const CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
	const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");
	const PriceOracleRouter = await ethers.getContractFactory("PriceOracleRouter");
	const SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle");
	const Comp = await ethers.getContractFactory("Comp");
	const VestingVaultFactory = await ethers.getContractFactory("VestingVault");
	const GovernorBravoDelegator = await ethers.getContractFactory("GovernorBravoDelegator")
	const GovernorBravoDelegate = await ethers.getContractFactory("GovernorBravoDelegate")
	const Timelock = await ethers.getContractFactory("Timelock");

	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY INTEREST MODEL ///////////////////
	/////////////////////////////////////////////////////////////

	const jumpRateModelV2 = await JumpRateModelV2Factory.deploy(
		"0",                    // baseRatePerYear
		"1000000000000000000",  // multiplierPerYear
		"4000000000000000000",  // jumpMultiplierPerYear
		"700000000000000000",   // kink_
		deployer.address        // _owner
	);

	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY COMPTROLLER    ///////////////////
	/////////////////////////////////////////////////////////////

	const unitroller = await UnitrollerFactory.deploy()
	const comptroller = await ComptrollerFactory.deploy();

	// SET PROXY
	await unitroller._setPendingImplementation(comptroller.address);
	await comptroller._become(unitroller.address);

	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY CTOKENS        ///////////////////
	/////////////////////////////////////////////////////////////

	// DEPLOY MOCK ERC20
	const rwa1 = await MockERC20Factory.deploy("RWA1", "RWA1");
	const rwa2 = await MockERC20Factory.deploy("RWA2", "RWA2");
	const rwa3 = await MockERC20Factory.deploy("RWA3", "RWA3");
	const note = await MockERC20Factory.deploy("cNote", "cNote");

	const cRwa1Impl = await CErc20DelegateFactory.deploy();
	const cRwa2Impl = await CErc20DelegateFactory.deploy();
	const cRwa3Impl = await CErc20DelegateFactory.deploy();
	const cNoteImpl = await CErc20DelegateFactory.deploy();

	const cRwa1Proxy = await CErc20DelegatorFactory.deploy(
		rwa1.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.BigNumber.from(10).pow(18),
		"cRWA1",
		"cRWA1",
		18,
		deployer.address,
		cRwa1Impl.address,
		[]
	);
	const cRwa2Proxy = await CErc20DelegatorFactory.deploy(
		rwa2.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.BigNumber.from(10).pow(18),
		"cRWA2",
		"cRWA2",
		18,
		deployer.address,
		cRwa2Impl.address,
		[]
	);
	const cRwa3Proxy = await CErc20DelegatorFactory.deploy(
		rwa3.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.BigNumber.from(10).pow(18),
		"cRWA3",
		"cRWA3",
		18,
		deployer.address,
		cRwa3Impl.address,
		[]
	);
	const cNoteProxy = await CErc20DelegatorFactory.deploy(
		note.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.BigNumber.from(10).pow(18),
		"cNote",
		"cNote",
		18,
		deployer.address,
		cNoteImpl.address,
		[]
	);

	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY CCNOTE        ///////////////////
	/////////////////////////////////////////////////////////////


	const ccNoteImpl = await CErc20DelegateFactory.deploy();
	const ccNoteProxy = await CErc20DelegatorFactory.deploy(
		cNoteProxy.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.BigNumber.from(10).pow(18),
		"ccNote",
		"ccNote",
		18,
		deployer.address,
		ccNoteImpl.address,
		[]
	);


	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY ORACLE				  ///////////////////
	/////////////////////////////////////////////////////////////

	const priceOracleRouter = await PriceOracleRouter.deploy();
	const simplePriceOracle1 = await SimplePriceOracle.deploy();
	const simplePriceOracle2 = await SimplePriceOracle.deploy();

	await simplePriceOracle1.setDirectPrice(rwa1.address, ethers.BigNumber.from(10).pow(18));
	await simplePriceOracle2.setDirectPrice(rwa2.address, ethers.BigNumber.from(10).pow(18).mul(2));
	await simplePriceOracle2.setDirectPrice(rwa3.address, ethers.BigNumber.from(10).pow(18).mul(3));
	await simplePriceOracle2.setDirectPrice(note.address, ethers.BigNumber.from(10).pow(18).mul(1));

	await priceOracleRouter.setOracle(cRwa1Proxy.address, simplePriceOracle1.address);
	await priceOracleRouter.setOracle(cRwa2Proxy.address, simplePriceOracle2.address);
	await priceOracleRouter.setOracle(cRwa3Proxy.address, simplePriceOracle2.address);
	await priceOracleRouter.setOracle(cNoteProxy.address, simplePriceOracle2.address);

	const Comptroller = await ethers.getContractAt("Comptroller", unitroller.address);
	const cRwa1 = await ethers.getContractAt("CErc20Delegate", cRwa1Proxy.address);
	const cRwa2 = await ethers.getContractAt("CErc20Delegate", cRwa2Proxy.address);
	const cRwa3 = await ethers.getContractAt("CErc20Delegate", cRwa3Proxy.address);
	const cNote = await ethers.getContractAt("CErc20Delegate", cNoteProxy.address);

	const ccNote = await ethers.getContractAt("CErc20Delegate", ccNoteProxy.address);

	await Comptroller._setPriceOracle(priceOracleRouter.address);


	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY COMP			  ///////////////////
	/////////////////////////////////////////////////////////////
	const comp = await Comp.deploy(deployer.address);
	const vestingVault = await VestingVaultFactory.deploy(comp.address);

	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY GOV			  ///////////////////
	/////////////////////////////////////////////////////////////

	const timelockDelay = 3 * 24 * 3600;

	const timelock = await Timelock.deploy(deployer.address, timelockDelay);
	const governorBravoDelegate = await GovernorBravoDelegate.deploy();
	const governorBravoDelegator = await GovernorBravoDelegator.deploy(
		timelock.address,
		comp.address,
		deployer.address,
		governorBravoDelegate.address,
		5761,
		10,
		ethers.BigNumber.from(10).pow(18).mul(4000)
	);

	const gov = await ethers.getContractAt("GovernorBravoDelegate", governorBravoDelegator.address);

	return {
		Comptroller,
		cRwa1,
		cRwa2,
		cRwa3,
		cNote,
		rwa1,
		rwa2,
		rwa3,
		note,
		ccNote,
		interestModel: jumpRateModelV2,
		router: priceOracleRouter,
		oracle1: simplePriceOracle1,
		oracle2: simplePriceOracle2,
		comp,
		vesting: vestingVault,
		gov: gov,
		timelock: timelock
	}
}

export default mockFixture
