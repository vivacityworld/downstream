import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { defaultAbiCoder } from "@ethersproject/abi";
import { ethers } from 'hardhat'
import LLAMA from "../_config/llama.json";
import { encodeRelativeStratigyConfig, encodeAccountConfig, encodeBytes32, createLlamaBootstrapHelper, getPermission } from "../../scripts/_utils/llama";

import {
	MockERC20,
	JumpRateModelV2,
	Comptroller,
	CErc20Delegate,
	PriceOracleRouter,
	SimplePriceOracle,
	VestingVault,
	CRWAToken,
	VCNote,
	WhitelistRouter,
	VCNotePriceOracle,
	MockTurnstile,
	MockLendingLedgerV2,
	MockOffchainFundPriceOracle,
	MockSDYCPriceOracle,
	OffchainFundPriceOracleRouter,
	MockOffchainFundWhitelist,
	MockSDYCWhitelist,
	SDYCPriceOracleRouter,
	CToken,
	Staking,
	VivaToken,
	IERC20,
	LlamaCore,
	LlamaPolicy,
	VivacityManageScript,
	VCNoteRouter,
	OffchainFundWhitelistRouter,
	VivaPoint,
	RedstoneOracle
} from '../../typechain'
import { LlamaAddress } from "../../scripts/types/deploy";

export interface Contracts {
	viva: IERC20
	of: MockERC20;
	sdyc: MockERC20;
	note: MockERC20;
	atom: MockERC20;
	wcanto: MockERC20;
	eth: MockERC20;
	cOF: CRWAToken;
	cSDYC: CRWAToken;
	comptroller: Comptroller;
	cNote: CErc20Delegate
	vcNote: VCNote;
	cATOM: CErc20Delegate;
	cETH: CErc20Delegate;
	cCANTO: CErc20Delegate;
	vestingVault: VestingVault;
	priceOracleRouter: PriceOracleRouter;
	whitelistRouter: WhitelistRouter;
	vcNotePriceOracle: VCNotePriceOracle;
	ofPriceOracleRouter: OffchainFundPriceOracleRouter;
	sdycPriceOracleRouter: SDYCPriceOracleRouter;
	lendingLedger: MockLendingLedgerV2;
	ofPriceOracle: MockOffchainFundPriceOracle;
	sdycPriceOracle: MockSDYCPriceOracle;
	ofWhitelist: MockOffchainFundWhitelist,
	ofWhitelistRouter: OffchainFundWhitelistRouter;
	sdycWhitelist: MockSDYCWhitelist;
	turnstile: MockTurnstile;
	staking: Staking;
	llamaCore: LlamaCore;
	llamaPolicy: LlamaPolicy;
	vivaScript: VivacityManageScript;
	stakerStrategy: string;
	llama: LlamaAddress;
	vcNoteInterestModel: JumpRateModelV2;
	vivaPoint: VivaPoint;
	redstoneOracle: RedstoneOracle;
	// vcNoteRouter: VCNoteRouter;
}

const deployFixture = async () => {
	const [deployer, user1] = await ethers.getSigners();

	const MockERC20Factory = await ethers.getContractFactory('MockERC20');
	const JumpRateModelV2Factory = await ethers.getContractFactory('JumpRateModelV2');
	const UnitrollerFactory = await ethers.getContractFactory('Unitroller');
	const ComptrollerFactory = await ethers.getContractFactory('Comptroller');
	const CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
	const CRWATokenFacotry = await ethers.getContractFactory("CRWAToken");
	const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");
	const PriceOracleRouterFactory = await ethers.getContractFactory("PriceOracleRouter");
	const VCNotePriceOracleFactory = await ethers.getContractFactory("VCNotePriceOracle");
	const WhitelistRouterFactory = await ethers.getContractFactory("WhitelistRouter");
	const VestingVaultFactory = await ethers.getContractFactory("VestingVault");
	const VivaPointFacotry = await ethers.getContractFactory("VivaPoint");

	const vcNoteDelegateFactory = await ethers.getContractFactory("VCNote");

	const MockLendingLedgerFactory = await ethers.getContractFactory("MockLendingLedgerV2");
	const MockOffchainFundPriceOracleFactory = await ethers.getContractFactory("MockOffchainFundPriceOracle");
	const MockSDYCPriceOracleFactory = await ethers.getContractFactory("MockSDYCPriceOracle");
	const MockOffchainFundWhitelistFactory = await ethers.getContractFactory("MockOffchainFundWhitelist");
	const MockOffchainFundWhitelistRouterFactory = await ethers.getContractFactory("OffchainFundWhitelistRouter");
	const MockSDYCWhitelistFactory = await ethers.getContractFactory("MockSDYCWhitelist");

	const OffchainFundPriceOracleRouterFactory = await ethers.getContractFactory("OffchainFundPriceOracleRouter");
	const SDYCPriceOracleRouterFactory = await ethers.getContractFactory("SDYCPriceOracleRouter");

	const MockTurnstileFactory = await ethers.getContractFactory("MockTurnstile");

	const RedstoneOracleFactory = await ethers.getContractFactory("RedstoneOracle");

	//////////////////////////////////////
	//      DEPLOY Mock Comptroller     //
	//////////////////////////////////////

	const lendingLedger = await MockLendingLedgerFactory.deploy(deployer.address);
	const ofPriceOracle = await MockOffchainFundPriceOracleFactory.deploy(1e8);
	const sdycPriceOracle = await MockSDYCPriceOracleFactory.deploy(1e8, 8);
	const ofWhitelist = await MockOffchainFundWhitelistFactory.deploy();
	const ofWhitelistRouter = await MockOffchainFundWhitelistRouterFactory.deploy();
	const sdycWhitelist = await MockSDYCWhitelistFactory.deploy();

	const blockNumber = await ethers.provider.getBlockNumber();
	const vivaPoint = await VivaPointFacotry.deploy(deployer.address, blockNumber + 10);

	// token
	const note = await MockERC20Factory.deploy("NOTE", "NOTE");
	const atom = await MockERC20Factory.deploy("ATOM", "ATOM");
	const eth = await MockERC20Factory.deploy("ETH", "ETH");
	const wcanto = await MockERC20Factory.deploy("WCANTO", "WCANTO");

	// comptroller
	const clmComptroller = await ComptrollerFactory.deploy();
	const clmUnitroller = await UnitrollerFactory.deploy();

	await clmUnitroller._setPendingImplementation(clmComptroller.address);
	await clmComptroller._become(clmUnitroller.address);

	// cToken
	const cNoteInterestRateModel = await JumpRateModelV2Factory.deploy(
		"0",
		"100000000000000000000",
		"400000000000000000000",
		"700000000000000000",
		deployer.address
	);

	const cNoteImpl = await CErc20DelegateFactory.deploy();
	const cNoteProxy = await CErc20DelegatorFactory.deploy(
		note.address,
		clmUnitroller.address,
		cNoteInterestRateModel.address,
		ethers.utils.parseEther("1"),
		`cNOTE`,
		`cNOTE`,
		18,
		deployer.address,
		cNoteImpl.address,
		[]
	);

	const clmComp = await ethers.getContractAt("Comptroller", clmUnitroller.address);
	await clmComp._supportMarket(cNoteProxy.address);

	//////////////////////////////////////////
	///////// 		VIVA TOKEN		  ////////
	//////////////////////////////////////////
	const VivaTokenFactory = await ethers.getContractFactory('VivaToken');
	const viva = await VivaTokenFactory.deploy("VIVA", "VIVA", ethers.utils.parseUnits("1000000000", 18));


	////////////////////////////////
	//      DEPLOY Llama Core     //
	////////////////////////////////
	const LlamaCore = await ethers.getContractFactory("LlamaCore");
	const LlamaAccount = await ethers.getContractFactory("LlamaAccount");
	const LlamaPolicy = await ethers.getContractFactory("LlamaPolicy");
	const LlamaPolicyMetadata = await ethers.getContractFactory("LlamaPolicyMetadata");
	const LlamaFactory = await ethers.getContractFactory("LlamaFactory");
	const LlamaLens = await ethers.getContractFactory("LlamaLens");

	const llamaCore = await LlamaCore.deploy();
	const llamaAccount = await LlamaAccount.deploy();
	const llamaPolicy = await LlamaPolicy.deploy();
	const llamaPolicyMetadata = await LlamaPolicyMetadata.deploy();
	const llamaFactory = await LlamaFactory.deploy(llamaCore.address, llamaPolicy.address, llamaPolicyMetadata.address);
	const llamaLens = await LlamaLens.deploy(llamaFactory.address);


	////////////////////////////////
	//    DEPLOY Llama Strategy   //
	////////////////////////////////
	const LlamaAbsolutePeerReview = await ethers.getContractFactory("LlamaAbsolutePeerReview");
	const LlamaAbsoluteQuorum = await ethers.getContractFactory("LlamaAbsoluteQuorum");
	const LlamaRelativeHolderQuorum = await ethers.getContractFactory("LlamaRelativeHolderQuorum");
	const LlamaRelativeQuantityQuorum = await ethers.getContractFactory("LlamaRelativeQuantityQuorum");
	const LlamaRelativeUniqueHolderQuorum = await ethers.getContractFactory("LlamaRelativeUniqueHolderQuorum");

	const llamaAbsolutePeerReview = await LlamaAbsolutePeerReview.deploy();
	const llamaAbsoluteQuorum = await LlamaAbsoluteQuorum.deploy();
	const llamaRelativeHolderQuorum = await LlamaRelativeHolderQuorum.deploy();
	const llamaRelativeQuantityQuorum = await LlamaRelativeQuantityQuorum.deploy();
	const llamaRelativeUniqueHolderQuorum = await LlamaRelativeUniqueHolderQuorum.deploy();

	const llamaFramework = {
		llamaCore: llamaCore.address,
		llamaAccount: llamaAccount.address,
		llamaPolicy: llamaPolicy.address,
		llamaPolicyMetadata: llamaPolicyMetadata.address,
		llamaFactory: llamaFactory.address,
		llamaLens: llamaLens.address,
		llamaAbsolutePeerReview: llamaAbsolutePeerReview.address,
		llamaAbsoluteQuorum: llamaAbsoluteQuorum.address,
		llamaRelativeHolderQuorum: llamaRelativeHolderQuorum.address,
		llamaRelativeQuantityQuorum: llamaRelativeQuantityQuorum.address,
		llamaRelativeUniqueHolderQuorum: llamaRelativeUniqueHolderQuorum.address,
	}

	////////////////////////////////
	//    DEPLOY Llama Instance   //
	////////////////////////////////

	const tx = await llamaFactory.deploy({
		name: LLAMA.instanceName,
		strategyLogic: llamaRelativeHolderQuorum.address,
		accountLogic: llamaAccount.address,
		initialStrategies: LLAMA.initialStrategies.map(encodeRelativeStratigyConfig),
		initialAccounts: LLAMA.initialAccounts.map(encodeAccountConfig),
		policyConfig: {
			roleDescriptions: LLAMA.initialRoleDescriptions.map(encodeBytes32),
			roleHolders: LLAMA.initialRoleHolders,
			rolePermissions: LLAMA.initialRolePermissions,
			color: LLAMA.instanceColor,
			logo: LLAMA.instanceLogo
		}
	});
	const result = await tx.wait();
	const data = result.events?.[result.events?.length - 1]?.args;

	const core = await ethers.getContractAt("LlamaCore", data?.[2]);
	const executor = await ethers.getContractAt("LlamaExecutor", data?.[3]);
	const policy = await ethers.getContractAt("LlamaPolicy", data?.[4]);

	const deployerStrategy = await llamaLens.computeLlamaStrategyAddress(llamaRelativeHolderQuorum.address, encodeRelativeStratigyConfig(LLAMA.initialStrategies[0]), core.address);
	const stakingModuleStrategy = await llamaLens.computeLlamaStrategyAddress(llamaRelativeHolderQuorum.address, encodeRelativeStratigyConfig(LLAMA.initialStrategies[1]), core.address);
	const stakerStrategy = await llamaLens.computeLlamaStrategyAddress(llamaRelativeHolderQuorum.address, encodeRelativeStratigyConfig(LLAMA.initialStrategies[2]), core.address);
	const vivacityTreasury = await llamaLens.computeLlamaAccountAddress(llamaAccount.address, encodeAccountConfig(LLAMA.initialAccounts[0]), core.address);


	////////////////////////////////
	//    DEPLOY Llama Script     //
	////////////////////////////////
	const llamaGovernanceScriptFactory = await ethers.getContractFactory("LlamaGovernanceScript");
	const llamaGovernanceScript = await llamaGovernanceScriptFactory.deploy();

	const vivacityManageScriptFactory = await ethers.getContractFactory("VivacityManageScript");
	const vivacityManageScript = await vivacityManageScriptFactory.deploy();

	const llama: LlamaAddress = {
		llamaCore: core.address,
		llamaExecutor: executor.address,
		llamaPolicy: policy.address,
		llamaLens: llamaLens.address,
		bootstrapStrategy: deployerStrategy,
		coreTeamStrategy50: stakingModuleStrategy,
		coreTeamStrategy100: stakingModuleStrategy,
		stakingModuleStrategy: stakingModuleStrategy,
		stakerStrategy: stakerStrategy,
		llamaGovScript: llamaGovernanceScript.address,
		vivaManageScript: vivacityManageScript.address,
		vivacityTreasury: vivacityTreasury,
	}

	////////////////////////////////
	//       DEPLOY STAKING       //
	////////////////////////////////

	const turnstile = await MockTurnstileFactory.deploy();

	const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
	const stakingFactory = await ethers.getContractFactory("Staking");

	const impl = await stakingFactory.deploy();
	const proxy = await proxyFactory.deploy(impl.address, []);

	const staking = await ethers.getContractAt("Staking", proxy.address);

	await staking.initialize(
		viva.address,
		core.address,
		policy.address,
		executor.address,
		turnstile.address,
		stakingModuleStrategy,
		stakerStrategy,
		2,
		3
	);

	////////////////////////////////
	//       DEPLOY VESTING       //
	////////////////////////////////
	const vestingVault = await VestingVaultFactory.deploy(viva.address);


	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY ORACLE				  ///////////
	/////////////////////////////////////////////////////////////

	const priceOracleRouter = await PriceOracleRouterFactory.deploy();
	const vcNotePriceOracle = await VCNotePriceOracleFactory.deploy(note.address);

	const ofPriceOracleRouter = await OffchainFundPriceOracleRouterFactory.deploy();
	const sdycPriceOracleRouter = await SDYCPriceOracleRouterFactory.deploy();

	const redstoneOracle = await RedstoneOracleFactory.deploy();

	/////////////////////////////////////////////////////////////
	/////////////////// WhitelistRuter				  ///////////
	/////////////////////////////////////////////////////////////


	const whitelistRouter = await WhitelistRouterFactory.deploy();


	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY INTEREST MODEL ///////////////////
	/////////////////////////////////////////////////////////////

	const jumpRateModelV2 = await JumpRateModelV2Factory.deploy(
		"2500000000000000",		// baseRatePerYear
		"2500000000000000",		// multiplierPerYear
		"1225000000000000000",  // jumpMultiplierPerYear
		"800000000000000000",	// kink_
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
	/////////////////// DEPLOY CCNOTE        ////////////////////
	/////////////////////////////////////////////////////////////

	const vcNoteImpl = await vcNoteDelegateFactory.deploy();
	const vcNoteProxy = await CErc20DelegatorFactory.deploy(
		note.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.utils.parseEther("1"),
		`vcNote`,
		`vcNote`,
		18,
		deployer.address,
		vcNoteImpl.address,
		[]
	);

	/////////////////////////////////////////////////////////////
	/////////////////// DEPLOY CTOKENS        ///////////////////
	/////////////////////////////////////////////////////////////

	// DEPLOY MOCK ERC20
	const of = await MockERC20Factory.deploy("OF", "OF");
	const sdyc = await MockERC20Factory.deploy("SDYC", "SDYC");

	const ofImpl = await CRWATokenFacotry.deploy();
	const sdycImpl = await CRWATokenFacotry.deploy();

	const ofProxy = await CErc20DelegatorFactory.deploy(
		of.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.BigNumber.from(10).pow(18),
		"cOF",
		"cOF",
		18,
		deployer.address,
		ofImpl.address,
		[]
	);
	const sdycProxy = await CErc20DelegatorFactory.deploy(
		sdyc.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.BigNumber.from(10).pow(18),
		"cSDYC",
		"cSDYC",
		18,
		deployer.address,
		sdycImpl.address,
		[]
	);

	// crypto assets
	const atomImpl = await CErc20DelegateFactory.deploy();
	const ethImpl = await CErc20DelegateFactory.deploy();
	const wcantoImpl = await CErc20DelegateFactory.deploy();

	const atomProxy = await CErc20DelegatorFactory.deploy(
		atom.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.utils.parseEther("1"),
		"cATOM",
		"cATOM",
		6,
		deployer.address,
		atomImpl.address,
		[]
	);

	const ethProxy = await CErc20DelegatorFactory.deploy(
		eth.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.utils.parseEther("1"),
		"cETH",
		"cETH",
		6,
		deployer.address,
		ethImpl.address,
		[]
	);

	const wcantoProxy = await CErc20DelegatorFactory.deploy(
		wcanto.address,
		unitroller.address,
		jumpRateModelV2.address,
		ethers.utils.parseEther("1"),
		"cCANTO",
		"cCANTO",
		6,
		deployer.address,
		wcantoImpl.address,
		[]
	);


	/////////////////////////////////////////////////////////////
	/////////////////// SETUP LLAMA           ///////////////////
	/////////////////////////////////////////////////////////////

	const helper = await createLlamaBootstrapHelper(llama);

	// role
	const DEPLOY_ROLE = 1;
	const STAKING_MODULE_ROLE = 2;
	const STAKER_ROLE = 3;

	// grant permission to deploy for initial setting
	await helper.setRolePermission(DEPLOY_ROLE, core, "setStrategyAuthorization(address,bool)", deployerStrategy);
	await helper.setRolePermission(DEPLOY_ROLE, core, "setScriptAuthorization(address,bool)", deployerStrategy);
	await helper.setRolePermission(DEPLOY_ROLE, vivacityManageScript, "multicall(bytes[])", deployerStrategy);
	await helper.setRolePermission(DEPLOY_ROLE, llamaGovernanceScript, "aggregate(address[],bytes[])", deployerStrategy);

	// authorize for using strategy
	await helper.execute(core, "setStrategyAuthorization", [stakingModuleStrategy, true]);
	await helper.execute(core, "setStrategyAuthorization", [stakerStrategy, true]);

	// authorize for using script
	await helper.execute(core, "setScriptAuthorization", [llamaGovernanceScript.address, true]);
	await helper.execute(core, "setScriptAuthorization", [vivacityManageScript.address, true]);

	// grant permission to staking module role
	// grant permission to staker role
	// grant role to staking module
	await helper.executeGovScript([
		[policy, "setRolePermission", [STAKING_MODULE_ROLE, getPermission(policy, "setRoleHolder(uint8,address,uint96,uint64)", stakingModuleStrategy), true]],
		[policy, "setRolePermission", [STAKING_MODULE_ROLE, getPermission(vivacityManageScript, "multicall(bytes[])", stakerStrategy), true]],
		[policy, "setRolePermission", [STAKING_MODULE_ROLE, getPermission(llamaGovernanceScript, "aggregate(address[],bytes[])", stakerStrategy), true]],
		[policy, "setRolePermission", [STAKER_ROLE, getPermission(vivacityManageScript, "multicall(bytes[])", stakerStrategy), true]],
		[policy, "setRolePermission", [STAKER_ROLE, getPermission(llamaGovernanceScript, "aggregate(address[],bytes[])", stakerStrategy), true]],
		[policy, "setRoleHolder", [STAKING_MODULE_ROLE, staking.address, 1, ethers.BigNumber.from(2).pow(64).sub(1)]],
	]);

	const cOF = await ethers.getContractAt("CRWAToken", ofProxy.address);
	const cSDYC = await ethers.getContractAt("CRWAToken", sdycProxy.address);
	const compt = await ethers.getContractAt("Comptroller", unitroller.address);
	const vcn = await ethers.getContractAt("VCNote", vcNoteProxy.address);
	const cn = await ethers.getContractAt("CErc20Delegate", cNoteProxy.address);

	const cATOM = await ethers.getContractAt("CErc20Delegate", atomProxy.address);
	const cETH = await ethers.getContractAt("CErc20Delegate", ethProxy.address);
	const cCANTO = await ethers.getContractAt("CErc20Delegate", wcantoProxy.address);

	await vcn.reinitialize(note.address, cNoteProxy.address, "0x0000000000000000000000000000000000000000", vivaPoint.address);
	await lendingLedger.whiteListLendingMarket(vcn.address, true);
	await vivaPoint.setWhitelist(vcn.address, true);

	return {
		viva,
		of,
		sdyc,
		note,
		atom,
		eth,
		wcanto,
		cOF,
		cSDYC,
		cATOM,
		cETH,
		cCANTO,
		comptroller: compt,
		vcNote: vcn,
		cNote: cn,
		vestingVault,
		priceOracleRouter,
		whitelistRouter,
		vcNotePriceOracle,
		ofPriceOracleRouter,
		sdycPriceOracleRouter,
		lendingLedger,
		ofPriceOracle,
		sdycPriceOracle,
		redstoneOracle,
		ofWhitelist,
		sdycWhitelist,
		turnstile,
		staking,
		llamaCore: core,
		llamaPolicy: policy,
		vivaScript: vivacityManageScript,
		stakerStrategy,
		llama,
		ofWhitelistRouter,
		vcNoteInterestModel: jumpRateModelV2,
		vivaPoint
	}
}

export default deployFixture
