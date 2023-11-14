
export interface DeployLocal {
  NOTE?: string;
  VIVA?: string;
  CNOTE?: string;
  turnstile?: string;
  llama?: LlamaAddress;
  llamaFramework?: LlamaFrameworkAddress,
  model?: Record<string, string>;
  vestingVault?: string;
  products?: Product[];
  lendingLedger?: string;
  whitelistRouter?: string;
  oracle?: Oracle;
  comptroller?: string;
  vcNote?: string;
  staking?: string;
  vivaLens?: string;
  rwa?: any;
  SPCTPool?: any,
  SPCT?: any,
  cSPCT?: any,
  SPCTOracleRouter?: any,
  SPCTWhitelistRouter?: any,
}

export interface LlamaFrameworkAddress {
  llamaCore: string;
  llamaAccount: string;
  llamaPolicy: string;
  llamaPolicyMetadata: string;
  llamaFactory: string;
  llamaLens: string;
  llamaAbsolutePeerReview: string;
  llamaAbsoluteQuorum: string;
  llamaRelativeHolderQuorum: string;
  llamaRelativeQuantityQuorum: string;
  llamaRelativeUniqueHolderQuorum: string;
}

export interface LlamaAddress {
  llamaCore: string;
  llamaExecutor: string;
  llamaPolicy: string;
  llamaLens: string;
  bootstrapStrategy: string;
  stakingModuleStrategy: string;
  stakerStrategy: string;
  coreTeamStrategy: string;
  llamaGovScript: string;
  vivaManageScript: string;
  vivacityTreasury: string;
}

export interface Product {
  name: string;
  description: string;
  symbol: string;
  comptroller: string;
  collateral: CToken;
  debt: CToken;
}

export interface CToken {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  model: string;
  underlyingAddress: string;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: string;
  oracle?: string;
}


export interface Oracle {
  priceOracleRouter: string;
  sdycPriceOracleRouter: string;
  offchainFundPriceOracleRouter: string;
  vcNotePriceOracle: string;
}