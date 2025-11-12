package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

const (
	HELIUS_API_KEY = "4fe39d22-5043-40d3-b2a1-dd8968ecf8a6"
	HELIUS_RPC     = "https://mainnet.helius-rpc.com/?api-key=" + HELIUS_API_KEY
	CONTROLLER     = "GLzZk1sczzW6fM4uPFeQCtTZQaf8H5VaBt99tUMbJAAW"
)

type RPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

type RPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result"`
	Error   *RPCError       `json:"error,omitempty"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func main() {
	ctx := context.Background()

	fmt.Println("🚀 Transfer Program Assets - Full Fetching")
	fmt.Println("==========================================\n")

	// Get balance
	balance, err := getBalance(ctx, CONTROLLER)
	if err != nil {
		log.Printf("❌ Error getting balance: %v\n", err)
	} else {
		fmt.Printf("💰 Balance: %d lamports (%.9f SOL)\n", balance, float64(balance)/1e9)
	}

	// Get signatures
	signatures, err := getSignatures(ctx, CONTROLLER)
	if err != nil {
		log.Printf("❌ Error getting signatures: %v\n", err)
	} else {
		fmt.Printf("📝 Signatures: %d found\n", len(signatures))
		if len(signatures) == 0 {
			fmt.Println("⚠️  Account does not exist or has no transactions")
		}
	}

	// Get account info
	accountInfo, err := getAccountInfo(ctx, CONTROLLER)
	if err != nil {
		log.Printf("❌ Error getting account info: %v\n", err)
	} else {
		fmt.Printf("ℹ️  Account Info: %s\n", string(accountInfo))
	}

	fmt.Println("\n✅ Full asset fetch complete")
}

func getBalance(ctx context.Context, address string) (int64, error) {
	req := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "getBalance",
		Params:  []interface{}{address},
	}

	resp, err := makeRPCCall(ctx, req)
	if err != nil {
		return 0, err
	}

	var result struct {
		Value int64 `json:"value"`
	}
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return 0, err
	}

	return result.Value, nil
}

func getSignatures(ctx context.Context, address string) ([]interface{}, error) {
	req := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "getSignaturesForAddress",
		Params:  []interface{}{address, map[string]int{"limit": 10}},
	}

	resp, err := makeRPCCall(ctx, req)
	if err != nil {
		return nil, err
	}

	var result []interface{}
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func getAccountInfo(ctx context.Context, address string) (json.RawMessage, error) {
	req := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "getAccountInfo",
		Params:  []interface{}{address, map[string]string{"encoding": "jsonParsed"}},
	}

	resp, err := makeRPCCall(ctx, req)
	if err != nil {
		return nil, err
	}

	return resp.Result, nil
}

func makeRPCCall(ctx context.Context, req RPCRequest) (*RPCResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", HELIUS_RPC, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	var rpcResp RPCResponse
	if err := json.NewDecoder(httpResp.Body).Decode(&rpcResp); err != nil {
		return nil, err
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("RPC error: %s", rpcResp.Error.Message)
	}

	return &rpcResp, nil
}
