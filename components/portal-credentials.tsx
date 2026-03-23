"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function PortalCredentials({
  portalUrl,
  portalUser,
  portalPassword,
}: {
  portalUrl: string | null;
  portalUser: string | null;
  portalPassword: string | null;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Portal Access</h3>

      {portalUrl && (
        <div>
          <Label>Portal URL</Label>
          <div className="flex gap-2 mt-1">
            <Input value={portalUrl} readOnly className="flex-1" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(portalUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(portalUrl, "url")}
            >
              {copiedField === "url" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {portalUser && (
        <div>
          <Label>Username</Label>
          <div className="flex gap-2 mt-1">
            <Input value={portalUser} readOnly className="flex-1" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(portalUser, "user")}
            >
              {copiedField === "user" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {portalPassword && (
        <div>
          <Label>Password</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type={showPassword ? "text" : "password"}
              value={portalPassword}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(portalPassword, "password")}
            >
              {copiedField === "password" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {!portalUrl && !portalUser && !portalPassword && (
        <p className="text-sm text-slate-500">No portal credentials saved</p>
      )}
    </div>
  );
}
