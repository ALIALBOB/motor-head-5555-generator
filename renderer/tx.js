// Builds the raw `applyParts` transaction the Save button sends via eth_sendTransaction
// (the website has no ethers/viem — it makes raw provider calls). We ABI-encode the calldata
// with viem's encodeFunctionData (hand-encoding a dynamic struct array is error-prone), then the
// wallet sends { to, data, value }. Same encoder is unit-tested against the real contract here.

const { encodeFunctionData } = require("viem");
const { encodeLayout } = require("./catalog.js");

const APPLY_PARTS_ABI = [{
  type: "function", name: "applyParts", stateMutability: "payable",
  inputs: [
    { name: "tokenId", type: "uint256" },
    { name: "schema", type: "uint16" },
    {
      name: "parts", type: "tuple[]", components: [
        { name: "itemId", type: "uint16" }, { name: "x", type: "int32" }, { name: "y", type: "int32" },
        { name: "scale", type: "uint16" }, { name: "rotation", type: "uint16" },
        { name: "colorwayId", type: "uint16" }, { name: "transparency", type: "uint8" },
      ],
    },
  ],
  outputs: [],
}];

// { tokenId, schema, layout (canvas item[]), contract, feeWei } -> { to, data, value } (hex value)
function buildApplyPartsTx({ tokenId, schema = 1, layout, contract, feeWei }) {
  const parts = encodeLayout(layout);
  const data = encodeFunctionData({
    abi: APPLY_PARTS_ABI,
    functionName: "applyParts",
    args: [BigInt(tokenId), Number(schema), parts],
  });
  return { to: contract, data, value: "0x" + BigInt(feeWei).toString(16) };
}

module.exports = { buildApplyPartsTx, APPLY_PARTS_ABI };
