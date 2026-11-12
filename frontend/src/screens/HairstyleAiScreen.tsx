import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Image as ImageIcon,
  Sparkles,
  Trash2,
} from "lucide-react";
import { authenticatedImageUrl, request, uploadHairstylePhoto } from "../api";

type Recommendation = {
  id: string;
  name: string;
  description: string;
  reason: string;
  maintenance: string;
  serviceCategory: string;
  matchReasons: string[];
};
type Session = {
  id: string;
  status: string;
  profile?: Record<string, string> | null;
  recommendations: Recommendation[];
};
type Job = {
  id: string;
  status: string;
  outputAssetId?: string | null;
  errorMessage?: string | null;
};

export function HairstyleAiScreen({
  onBack,
  onFindSalon,
}: {
  onBack: () => void;
  onFindSalon: (styleName?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("Ready when you are");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!job?.id || result) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await request<Job>(`/ai/hairstyle/jobs/${job.id}`);
        if (cancelled) return;
        setJob(next);
        if (next.status === "completed" && next.outputAssetId) {
          setResult(authenticatedImageUrl(`/media/${next.outputAssetId}`));
          setStage("Preview ready");
          setBusy(false);
        } else if (next.status === "failed") {
          setError(next.errorMessage || "The preview could not be generated.");
          setBusy(false);
        } else window.setTimeout(() => void poll(), 1500);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to check generation status.",
          );
          setBusy(false);
        }
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [job?.id, result]);

  const chooseFile = (value: File | undefined) => {
    if (!value) return;
    if (!/image\/(jpeg|png|webp)/i.test(value.type))
      return setError("Choose a JPG, PNG, or WebP image.");
    if (value.size > 5 * 1024 * 1024)
      return setError("Images must be 5 MB or smaller.");
    setFile(value);
    setPreview(URL.createObjectURL(value));
    setConsent(false);
    setError("");
    setSession(null);
    setResult("");
  };

  const analyze = async () => {
    if (!file || !consent)
      return setError("Choose a photo and confirm photo processing consent.");
    setBusy(true);
    setError("");
    try {
      setStage("Uploading photo");
      const uploaded = await uploadHairstylePhoto(file);
      setStage("Analyzing visible hair characteristics");
      const analyzed = await request<Session>("/ai/hairstyle/analyze", {
        method: "POST",
        body: JSON.stringify({ sessionId: uploaded.id }),
      });
      setSession(analyzed);
      setStage("Choose a hairstyle");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not analyze this photo.",
      );
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!session || !selected) return;
    setBusy(true);
    setError("");
    setStage("Preparing your selected hairstyle");
    try {
      setJob(
        await request<Job>("/ai/hairstyle/generate", {
          method: "POST",
          body: JSON.stringify({
            sessionId: session.id,
            recommendationId: selected.id,
            idempotencyKey: `${session.id}:${selected.id}`,
          }),
        }),
      );
    } catch (cause) {
      setBusy(false);
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not start the preview.",
      );
    }
  };

  const saveToPassport = async () => {
    if (!selected || !job?.outputAssetId) return;
    try {
      const passport = await request<any>("/passport");
      const image = `/media/${job.outputAssetId}`;
      await request("/passport", {
        method: "PUT",
        body: JSON.stringify({
          ...passport,
          afterImage: image,
          styles: [
            ...(passport.styles || []),
            { name: selected.name, meta: "AI preview", tone: "blush", image },
          ],
        }),
      });
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save this look.",
      );
    }
  };

  const deleteSession = async () => {
    if (!session) return;
    await request(`/ai/hairstyle/sessions/${session.id}`, { method: "DELETE" });
    setFile(null);
    setPreview("");
    setSession(null);
    setSelected(null);
    setJob(null);
    setResult("");
  };

  return (
    <section className="page ai-hairstyle-page">
      <div className="ai-hairstyle-heading">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <span className="ai-eyebrow">
          <Sparkles size={14} /> HALO AI STUDIO
        </span>
        <h1>Find your next look.</h1>
        <p>
          Explore five salon-ready hairstyle ideas from one private photo, then
          see one selected look on you.
        </p>
      </div>
      <div className="ai-hairstyle-grid">
        <section className="panel ai-photo-panel">
          {result || preview ? (
            <img
              src={result || preview}
              alt="Your hairstyle preview"
              className="ai-photo"
            />
          ) : (
            <div className="ai-photo-empty">
              <Camera size={32} />
              <strong>Your photo stays private</strong>
              <span>
                Use a clear front-facing photo with your face and hair visible.
              </span>
            </div>
          )}
          {!file && (
            <label className="ai-upload-button">
              <ImageIcon size={17} /> Choose a photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </label>
          )}
          {file && !session && (
            <div className="ai-consent">
              <strong>Before we begin</strong>
              <p>
                Halo uses this photo only for visible hairstyle analysis and
                your requested preview. We do not diagnose medical conditions or
                train models with it.
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />{" "}
                I consent to photo processing for this session.
              </label>
              <button
                className="primary"
                disabled={!consent || busy}
                onClick={() => void analyze()}
              >
                Analyze my hair
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setFile(null);
                  setPreview("");
                  setConsent(false);
                }}
              >
                Choose another photo
              </button>
            </div>
          )}
          {busy && (
            <div className="ai-progress" aria-live="polite">
              <span className="spinner" />
              <strong>{stage}</strong>
              <small>This may take a moment.</small>
            </div>
          )}
          {error && <p className="ai-error">{error}</p>}
        </section>
        <section className="ai-recommendations">
          {!session && !busy && (
            <div className="ai-intro">
              <span className="ai-number">01</span>
              <h2>Upload a clear photo</h2>
              <p>
                We’ll look at visible face and hair characteristics only. Your
                preferences are always part of the conversation.
              </p>
            </div>
          )}
          {session && !result && (
            <>
              <div className="ai-section-heading">
                <span className="ai-number">02</span>
                <div>
                  <h2>Choose your direction</h2>
                  <p>Five distinct options, ready for a salon conversation.</p>
                </div>
              </div>
              <div className="ai-recommendation-list">
                {session.recommendations.map((item) => (
                  <button
                    key={item.id}
                    className={
                      selected?.id === item.id
                        ? "ai-recommendation selected"
                        : "ai-recommendation"
                    }
                    onClick={() => setSelected(item)}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.maintenance} upkeep · {item.serviceCategory}
                      </span>
                    </div>
                    <p>{item.description}</p>
                    <small>{item.reason}</small>
                    {selected?.id === item.id && <Check size={18} />}
                  </button>
                ))}
              </div>
              <button
                className="primary ai-generate"
                disabled={!selected || busy}
                onClick={() => void generate()}
              >
                See on me
              </button>
            </>
          )}
          {result && (
            <div className="ai-result">
              <span className="ai-number">03</span>
              <h2>{selected?.name}</h2>
              <p>Preview generated from your uploaded photo.</p>
              <button
                className="primary"
                onClick={() => onFindSalon(selected?.name)}
              >
                Find a salon to book
              </button>
              <button
                className="secondary"
                onClick={() => void saveToPassport()}
              >
                {saved ? "Saved to hair passport" : "Save this look"}
              </button>
              <button
                className="secondary"
                onClick={() =>
                  void navigator.share?.({
                    title: selected?.name,
                    text: `I tried ${selected?.name} with Halo AI.`,
                  })
                }
              >
                Share this look
              </button>
              <button
                className="danger-link"
                onClick={() => void deleteSession()}
              >
                <Trash2 size={14} /> Delete photos and session
              </button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
