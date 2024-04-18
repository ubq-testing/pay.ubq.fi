import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { createClient } from "@supabase/supabase-js";
import { AppState, app } from "../app-state";
import { useFastestRpc } from "../rpc-optimization/get-optimal-provider";
import { buttonController, toaster } from "../toaster";
import { connectWallet } from "../web3/connect-wallet";
import { checkRenderInvalidatePermitAdminControl, checkRenderMakeClaimControl } from "../web3/erc20-permit";
import { verifyCurrentNetwork } from "../web3/verify-current-network";
import { claimRewardsPagination } from "./claim-rewards-pagination";
import { renderTransaction } from "./render-transaction";
import { setClaimMessage } from "./set-claim-message";
import { RewardPermit, claimTxT } from "./tx-type";

declare const SUPABASE_URL: string;
declare const SUPABASE_ANON_KEY: string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const table = document.getElementsByTagName(`table`)[0];
const urlParams = new URLSearchParams(window.location.search);
const base64encodedTxData = urlParams.get("claim");

export async function readClaimDataFromUrl(app: AppState) {
  if (!base64encodedTxData) {
    // No claim data found
    setClaimMessage({ type: "Notice", message: `No claim data found.` });
    table.setAttribute(`data-make-claim`, "error");
    return;
  }

  app.claims = decodeClaimData(base64encodedTxData).flat();
  app.claimTxs = await getClaimedTxs(app);
  try {
    app.provider = await useFastestRpc(app);
  } catch (e) {
    toaster.create("error", `${e}`);
  }

  if (window.ethereum) {
    try {
      app.signer = await connectWallet();
    } catch (error) {
      /* empty */
    }
    window.ethereum.on("accountsChanged", () => {
      checkRenderMakeClaimControl(app).catch(console.error);
      checkRenderInvalidatePermitAdminControl(app).catch(console.error);
    });
  } else {
    buttonController.hideAll();
    toaster.create("info", "Please use a web3 enabled browser to collect this reward.");
  }
  displayRewardDetails();
  displayRewardPagination();

  await renderTransaction();
  if (app.networkId !== null) {
    await verifyCurrentNetwork(app.networkId);
  } else {
    throw new Error("Network ID is null");
  }
}

async function getClaimedTxs(app: AppState): Promise<Record<string, string>> {
  const txs: Record<string, string> = Object.create(null);
  for (const claim of app.claims) {
    const { data } = await supabase.from("permits").select("transaction").eq("nonce", claim.permit.nonce.toString());

    if (data?.length == 1 && data[0].transaction !== null) {
      txs[claim.permit.nonce.toString()] = data[0].transaction as string;
    }
  }
  return txs;
}

function decodeClaimData(base64encodedTxData: string): RewardPermit[] {
  let permit;

  try {
    permit = JSON.parse(atob(base64encodedTxData));
    return [Value.Decode(Type.Array(claimTxT), permit)];
  } catch (error) {
    console.error(error);
    setClaimMessage({ type: "Error", message: `Invalid claim data passed in URL` });
    table.setAttribute(`data-make-claim`, "error");
    throw error;
  }
}

function displayRewardPagination() {
  const rewardsCount = document.getElementById("rewardsCount");
  if (rewardsCount) {
    if (!app.claims || app.claims.length <= 1) {
      // already hidden
    } else {
      claimRewardsPagination(rewardsCount);
    }
  }
}

function displayRewardDetails() {
  let isDetailsVisible = false;
  table.setAttribute(`data-details-visible`, isDetailsVisible.toString());
  const additionalDetails = document.getElementById(`additionalDetails`) as HTMLElement;
  additionalDetails.addEventListener("click", () => {
    isDetailsVisible = !isDetailsVisible;
    table.setAttribute(`data-details-visible`, isDetailsVisible.toString());
  });
}
