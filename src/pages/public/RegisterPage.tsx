import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { registerPlayer } from "@/services/firebase-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Upload, CheckCircle, User } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterPage() {
  const { championshipId } = useParams<{ championshipId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Photo must be less than 5MB");
        return;
      }
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!championshipId || !name.trim() || !photo) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await registerPlayer(championshipId, name.trim(), photo);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center animate-slide-up">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">
              Registration Successful!
            </h2>
            <p className="text-muted-foreground mb-6">
              Welcome aboard, <span className="text-foreground font-semibold">{name}</span>!
              You&apos;ve been registered for the tournament.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => { setSuccess(false); setName(""); setPhoto(null); setPreview(null); }}>
                Register Another Player
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                View Tournament
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Player Registration</CardTitle>
          <CardDescription>
            4inCup Cricket Tournament – Season 1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative h-28 w-28 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex items-center justify-center overflow-hidden bg-secondary"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <User className="h-8 w-8 mb-1" />
                    <span className="text-[10px]">Upload Photo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                {photo ? "Change Photo" : "Upload Photo"}
              </Button>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Player Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting || !name.trim() || !photo}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="mr-2 text-primary-foreground" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
