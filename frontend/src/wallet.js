import { ethers } from "ethers";

export async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return null;
  }

  // 🔥 THIS triggers MetaMask popup
  await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const address = await signer.getAddress();
  console.log("Wallet connected:", address);

  return { provider, signer, address };
}
