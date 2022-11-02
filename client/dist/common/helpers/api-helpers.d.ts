import { PoolExtracted, QueryPoolsAndUsersResponse } from "./interfaces";
declare function _updatePoolsAndUsers(response: QueryPoolsAndUsersResponse): Promise<{
    pools: PoolExtracted[];
    users: import("./interfaces").UserExtracted[];
}>;
declare function _mockUpdatePoolsAndUsers(): Promise<QueryPoolsAndUsersResponse>;
declare function _requestValidators(): Promise<[string, string[]][]>;
export { _updatePoolsAndUsers, _mockUpdatePoolsAndUsers, _requestValidators };
