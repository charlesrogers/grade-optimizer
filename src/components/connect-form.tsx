"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LMSType = "canvas" | "skyward";

export function ConnectForm() {
  const router = useRouter();
  const [lmsType, setLmsType] = useState<LMSType>("canvas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas fields
  const [baseUrl, setBaseUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // Skyward fields
  const [skywardUrl, setSkywardUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let res: Response;

      if (lmsType === "canvas") {
        res = await fetch("/api/canvas/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseUrl, accessToken }),
        });
      } else {
        res = await fetch("/api/skyward/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loginUrl: skywardUrl,
            username,
            password,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to connect");
        return;
      }

      if (data.isObserver && data.observees?.length > 0) {
        sessionStorage.setItem("observees", JSON.stringify(data.observees));
        router.push("/family");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
        {/* LMS Toggle */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5 mb-4">
            <button
              type="button"
              onClick={() => setLmsType("canvas")}
              className={`flex-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                lmsType === "canvas"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Canvas LMS
            </button>
            <button
              type="button"
              onClick={() => setLmsType("skyward")}
              className={`flex-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                lmsType === "skyward"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Skyward
            </button>
          </div>

          <h2 className="text-[15px] font-semibold text-card-foreground">
            Connect {lmsType === "canvas" ? "Canvas" : "Skyward"}
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {lmsType === "canvas"
              ? "Enter your school's Canvas URL and a personal access token."
              : "Enter your Skyward Family Access URL and login credentials."}
          </p>
        </div>

        <form onSubmit={handleConnect} className="px-6 pb-6 space-y-4">
          {lmsType === "canvas" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="baseUrl" className="text-[13px] font-medium">
                  Canvas URL
                </Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://yourschool.instructure.com"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="accessToken"
                  className="text-[13px] font-medium"
                >
                  Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Paste your Canvas access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  required
                  className="h-9 text-[13px] font-mono"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Settings → Approved Integrations → New Access Token
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label
                  htmlFor="skywardUrl"
                  className="text-[13px] font-medium"
                >
                  Skyward URL
                </Label>
                <Input
                  id="skywardUrl"
                  type="url"
                  placeholder="https://skyward.yourdistrict.net/scripts/wsisa.dll/WService=wsEAplus"
                  value={skywardUrl}
                  onChange={(e) => setSkywardUrl(e.target.value)}
                  required
                  className="h-9 text-[13px]"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  The URL from your Skyward Family Access login page
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[13px] font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Your Skyward username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your Skyward password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5 text-[13px] text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-9 text-[13px] font-medium shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              `Connect to ${lmsType === "canvas" ? "Canvas" : "Skyward"}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
