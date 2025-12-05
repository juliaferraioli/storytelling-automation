export default async function handler(req, res) {
    // Restrict to POST requests
    if (req.method !== "POST") {
        // return new Response("kinda not ok")
        return new Response(
            {
            status: 405,
            statusText: "Method not allowed"
            }
        )
    }

    try {
        // Validate incoming payload
        const { payload } = req.body;
        if (!payload || !payload.responses) {
            return new Response(
                {
                    status: 400,
                    statusText: "Invalid or missing payload.responses"
                }
            )
        }

        // Extract storyteller info with safe defaults
        const bookerName = payload?.responses?.name?.value || "Unknown";
        const bookerEmail = payload?.responses?.email?.value || "No email";
        const story = payload?.responses?.story?.value || "No story provided";
        const pronouns = payload?.responses?.pronouns?.value || "Not provided";
        const links = payload?.responses?.links?.value || "No links";
        const notes = payload?.responses?.notes?.value || "No notes";
        const profilePicture = payload?.responses?.profile_picture?.value || "No picture";
        const consent = payload?.responses?.["I-consent-to-the-recording-of-this-session"]?.value
            ? " Consented"
            : " Not Consented";

        // Issue template (unchanged)
        const issueTemplate = `
# Roles:

- coordinator:
- facilitator:
- editor:
- publisher:

# Steps

## scheduling

- [ ] (coordinator) reach out to storyteller
- [ ] (coordinator) confirm scheduling and assigned facilitator
- [ ] (coordinator) create storyteller's folder in [shared drive](https://drive.google.com/drive/u/0/folders/129lq8IvGjqezYE0vlVOeNR-AaT9aioYG)

## recording

- [ ] (facilitator) host session with storyteller
- [ ] (facilitator) upload recording to the folder that has been shared with you

## processing

- [ ] (coordinator) trim/edit audio (if necessary)
- [ ] (coordinator) convert to 128kbps (if necessary)
- [ ] (coordinator) send to transcription service
- [ ] (coordinator) add transcription and files to shared folder

## editing

- [ ] (editor) edit transcript for readability
- [ ] (editor) break into paragraphs
- [ ] (editor) fine-tune title
- [ ] (editor) add logical headings
- [ ] (editor) add a summary
- [ ] (editor) suggest tags (optional; see [opensourcestories.org/tags](https://www.opensourcestories.org/tags/) for existing tags)
- [ ] (editor) write copy for social media

## publishing

- [ ] (publisher) upload recording to StoryCorps
- [ ] (publisher) upload recording to audio host
- [ ] (publisher) create PR
- [ ] (publisher) get review and merge

## promoting

- [ ] (coordinator or publisher) schedule posts on various channels
`;

        // Validate environment variables
        const githubRepo = process.env.ISSUE_API_URL;
        if (!githubRepo || !githubRepo.includes("api.github.com")) {
            console.log("ISSUE_API_URL must be a valid GitHub API URL (e.g., https://api.github.com/repos/opensourcestories/storytelling-automation/issues)");
            return new Response(
                {
                    status: 500,
                    statusText: "ISSUE_API_URL must be a valid GitHub API URL (e.g., https://api.github.com/repos/opensourcestories/storytelling-automation/issues)"
                }
            )
        }

        const githubToken = process.env.GITHUB_TOKEN;

        if (!githubToken) {
            console.log("GITHUB_TOKEN environment variable not set");
            return new Response(
                {
                    status: 500,
                    statusText: "GITHUB_TOKEN environment variable not set"
                }
            )
        }

        // Construct GitHub API payload (explicitly exclude invalid fields like 'links')
        const issuePayload = {
            title: `[STORY] Publish ${bookerName}'s story`,
            body: `${issueTemplate}`,
            labels: ["story"],
        };

        // Debug: Log the payload being sent to GitHub
        console.log("GitHub API payload:", JSON.stringify(issuePayload, null, 2));

        // Call GitHub API to create issue
        const response = await fetch(githubRepo, {
            method: "POST",
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "Authorization": `Bearer ${githubToken}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(issuePayload),
        });

        const data = await response.json();

        if (response.ok) {
            return new Response(ok,
                {
                    status: 200,
                    statusText: data.html_url
                }
            )
        } else {
            console.error("GitHub API error:", data);
            return new Response(
                {
                    status: 500,
                    statusText: "GitHub API error"
                }
            )
        }
    } catch (err) {
        console.error("Webhook error:", err);
        return new Response(
            {
                status: 500,
                statusText: "Internal Server Error"
            }
        )
    }
}