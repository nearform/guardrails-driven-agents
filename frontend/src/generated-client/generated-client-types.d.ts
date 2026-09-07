export interface FullResponse<T, U extends number> {
  'statusCode': U;
  'headers': object;
  'body': T;
}

export type HealthCheckRequest = {
  
}

/**
 * The service is up.
 */
export type HealthCheckResponseOK = { 'status': string }
export type HealthCheckResponses =
  FullResponse<HealthCheckResponseOK, 200>

export type ListTransactionsRequest = {
  
}

/**
 * All transactions.
 */
export type ListTransactionsResponseOK = Array<{ 'id': string; 'sender': string; 'beneficiary': string; 'amount': string; 'currency': string; 'description'?: string | null; 'created_at': string }>
export type ListTransactionsResponses =
  FullResponse<ListTransactionsResponseOK, 200>

export type CreateTransactionRequest = {
  body: {
    'sender': string;
    'beneficiary': string;
    /**
     * Positive decimal amount, with up to 10 integer and 2 fractional digits.
     */
    'amount': string;
    'currency': string;
    'description'?: string | null;
  }
}

/**
 * The created transaction.
 */
export type CreateTransactionResponseCreated = { 'id': string; 'sender': string; 'beneficiary': string; 'amount': string; 'currency': string; 'description'?: string | null; 'created_at': string }
/**
 * Validation failed (e.g. non-positive amount, malformed currency).
 */
export type CreateTransactionResponseBadRequest = { 'status_code': number; 'detail': string; 'extra'?: Array<object> }
export type CreateTransactionResponses =
  FullResponse<CreateTransactionResponseCreated, 201>
  | FullResponse<CreateTransactionResponseBadRequest, 400>

export type GetTransactionRequest = {
  path: {
    /**
     * The transaction's UUID.
     */
    'id': string;
  }
}

/**
 * The requested transaction.
 */
export type GetTransactionResponseOK = { 'id': string; 'sender': string; 'beneficiary': string; 'amount': string; 'currency': string; 'description'?: string | null; 'created_at': string }
/**
 * No transaction exists with that id.
 */
export type GetTransactionResponseNotFound = { 'status_code': number; 'detail': string; 'extra'?: Array<object> }
export type GetTransactionResponses =
  FullResponse<GetTransactionResponseOK, 200>
  | FullResponse<GetTransactionResponseNotFound, 404>



export interface GeneratedClient {
  setBaseUrl(newUrl: string): void;
  setDefaultHeaders(headers: object): void;
  setDefaultFetchParams(fetchParams: RequestInit): void;
  /**
   * Liveness check
   * @param req - request parameters object
   * @returns the API response
   */
  healthCheck(req: HealthCheckRequest): Promise<HealthCheckResponses>;
  /**
   * List all transactions
   * @param req - request parameters object
   * @returns the API response
   */
  listTransactions(req: ListTransactionsRequest): Promise<ListTransactionsResponses>;
  /**
   * Create a transaction
   * @param req - request parameters object
   * @returns the API response
   */
  createTransaction(req: CreateTransactionRequest): Promise<CreateTransactionResponses>;
  /**
   * Get a single transaction by id
   * @param req - request parameters object
   * @returns the API response
   */
  getTransaction(req: GetTransactionRequest): Promise<GetTransactionResponses>;
}
type PlatformaticFrontendClient = Omit<GeneratedClient, 'setBaseUrl'>
type BuildOptions = {
  headers?: object
}
export default function build(url: string, options?: BuildOptions): PlatformaticFrontendClient
