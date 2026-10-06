import { db } from "@intervue/db";

const REPO_NAME = "intervue-solutions";

const EXTENSIONS: Record<string, string> = {
  CPP: "cpp",
  JAVA: "java",
  PYTHON: "py",
  JAVASCRIPT: "js",
  TYPESCRIPT: "ts",
};

export async function syncSolutionToGitHub(
  userId: string,
  problemSlug: string,
  problemTitle: string,
  language: string,
  sourceCode: string
) {
  try {
    // 1. Get the user's GitHub account and access token
    const account = await db.account.findFirst({
      where: {
        userId,
        providerId: "github",
      },
    });

    if (!account || !account.accessToken) {
      console.log(`[GitHub Sync] No GitHub token for user ${userId}. Skipping sync.`);
      return;
    }

    const token = account.accessToken;
    
    // Get the GitHub username using the token
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
    const ghUser = await userRes.json();
    const username = ghUser.login;

    // 2. Ensure repository exists
    const repoRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (repoRes.status === 404) {
      console.log(`[GitHub Sync] Repository not found, creating ${REPO_NAME} for ${username}`);
      const createRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: REPO_NAME,
          description: "My coding solutions synced automatically from Intervue Prephub.",
          private: false,
          auto_init: true
        })
      });
      if (!createRes.ok) throw new Error("Failed to create repository");
      
      // Wait a moment for repo to be fully created
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 3. Commit the file
    const ext = EXTENSIONS[language] || "txt";
    const filePath = `${problemSlug}/solution.${ext}`;
    const url = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${filePath}`;

    // Check if file already exists to get its SHA (required for updating)
    const fileCheckRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    let sha: string | undefined;
    if (fileCheckRes.ok) {
      const fileData = await fileCheckRes.json();
      sha = fileData.sha;
    }

    const contentBase64 = Buffer.from(sourceCode).toString("base64");
    
    const commitMsg = `✅ Solve ${problemTitle} (${language})`;

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMsg,
        content: contentBase64,
        sha,
      })
    });

    if (!putRes.ok) {
      const errBody = await putRes.text();
      throw new Error(`Failed to push to GitHub: ${errBody}`);
    }

    console.log(`[GitHub Sync] Successfully synced ${problemSlug} for ${username}`);
  } catch (error) {
    console.error("[GitHub Sync] Error:", error);
  }
}
