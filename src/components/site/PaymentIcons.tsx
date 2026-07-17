// Real brand logos via `simple-icons` (official SVG paths).
// Bundled into the project so replicated instances render identical assets.

import type { ReactElement } from "react";
import {
  siVisa,
  siMastercard,
  siAmericanexpress,
  siPix,
  siPaypal,
  siDinersclub,
  siDiscover,
  siGooglepay,
  siApplepay,
} from "simple-icons/icons";
import { ShieldCheck, Lock, BadgeCheck, ShoppingBag, Store, HandCoins } from "lucide-react";

type IconProps = { title?: string; className?: string };

/* ---------- Brand card (real logo on colored card) ---------- */

function BrandCard({
  icon,
  bg,
  fg = "#fff",
  title,
  className,
}: {
  icon: { path: string; title: string };
  bg: string;
  fg?: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={title ?? icon.title}
      className={`inline-flex items-center justify-center rounded border border-black/5 ${className ?? ""}`}
      style={{ background: bg, width: 48, height: 32 }}
    >
      <svg viewBox="0 0 24 24" width="26" height="18" aria-hidden="true">
        <path d={icon.path} fill={fg} />
      </svg>
    </span>
  );
}

/* ---------- Payment brand icons ---------- */

export const VisaIcon = (p: IconProps) => (
  <BrandCard icon={siVisa} bg={`#${siVisa.hex}`} {...p} />
);
export const MastercardIcon = (p: IconProps) => (
  <BrandCard icon={siMastercard} bg="#111827" {...p} />
);
export const AmexIcon = (p: IconProps) => (
  <BrandCard icon={siAmericanexpress} bg={`#${siAmericanexpress.hex}`} {...p} />
);
export const PixIcon = (p: IconProps) => (
  <BrandCard icon={siPix} bg="#fff" fg={`#${siPix.hex}`} {...p} />
);
export const PaypalIcon = (p: IconProps) => (
  <BrandCard icon={siPaypal} bg="#fff" fg={`#${siPaypal.hex}`} {...p} />
);
export const DinersIcon = (p: IconProps) => (
  <BrandCard icon={siDinersclub} bg={`#${siDinersclub.hex}`} {...p} />
);
export const DiscoverIcon = (p: IconProps) => (
  <BrandCard icon={siDiscover} bg="#fff" fg={`#${siDiscover.hex}`} {...p} />
);
export const GooglePayIcon = (p: IconProps) => (
  <BrandCard icon={siGooglepay} bg="#fff" fg={`#${siGooglepay.hex}`} {...p} />
);
export const ApplePayIcon = (p: IconProps) => (
  <BrandCard icon={siApplepay} bg="#000" fg="#fff" {...p} />
);

/* Elo, Hipercard and Boleto do not exist in simple-icons; keep clean text-mark cards. */

export function EloIcon({ title = "Elo", className }: IconProps) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-flex items-center justify-center rounded border border-black/5 ${className ?? ""}`}
      style={{ background: "#000", width: 48, height: 32 }}
    >
      <svg viewBox="0 0 48 32" width="48" height="32" aria-hidden="true">
        <circle cx="24" cy="16" r="7" fill="#fff" />
        <path d="M18 13.5l2.2 1.3-2.2 1.3v-2.6Z" fill="#FFCB05" />
        <path d="M30 13.5l-2.2 1.3 2.2 1.3v-2.6Z" fill="#EF4123" />
        <path d="M21.5 21.2l1.3-2.3 1.3 2.3h-2.6Z" fill="#00A4E0" />
        <circle cx="24" cy="16" r="3" fill="#000" />
      </svg>
    </span>
  );
}

export function HipercardIcon({ title = "Hipercard", className }: IconProps) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-flex items-center justify-center rounded border border-black/5 ${className ?? ""}`}
      style={{ background: "#B3131B", width: 48, height: 32 }}
    >
      <span className="text-white font-black tracking-tight" style={{ fontSize: 9 }}>
        Hipercard
      </span>
    </span>
  );
}

export function BoletoIcon({ title = "Boleto", className }: IconProps) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-flex items-center justify-center rounded border ${className ?? ""}`}
      style={{ background: "#fff", width: 48, height: 32 }}
    >
      <svg viewBox="0 0 48 32" width="48" height="32" aria-hidden="true">
        <g fill="#111">
          {[6, 9, 11.5, 15.5, 18, 21.5, 24, 27, 31, 33.5, 37, 39.5].map((x, i) => (
            <rect key={i} x={x} y="8" width={i % 3 === 0 ? 1.5 : i % 3 === 1 ? 1 : 2.5} height="16" />
          ))}
        </g>
      </svg>
    </span>
  );
}

/* ---------- Security seals (generic, non-trademarked) ---------- */

function SealCard({
  bg,
  fg,
  Icon,
  line1,
  line2,
  title,
  className,
}: {
  bg: string;
  fg: string;
  Icon: typeof ShieldCheck;
  line1: string;
  line2?: string;
  title: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-flex items-center gap-1.5 rounded border border-black/5 px-2 ${className ?? ""}`}
      style={{ background: bg, color: fg, height: 32, minWidth: 72 }}
    >
      <Icon size={16} strokeWidth={2.5} />
      <span className="flex flex-col leading-none">
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.5 }}>{line1}</span>
        {line2 && (
          <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.8, marginTop: 2 }}>
            {line2}
          </span>
        )}
      </span>
    </span>
  );
}

export const SslIcon = (p: IconProps) => (
  <SealCard bg="#0F7B3F" fg="#fff" Icon={Lock} line1="SSL" line2="SECURE" title="SSL Seguro" {...p} />
);
export const SiteSeguroIcon = (p: IconProps) => (
  <SealCard bg="#fff" fg="#0F7B3F" Icon={ShieldCheck} line1="SITE" line2="SEGURO" title="Site Seguro" {...p} />
);
export const LgpdIcon = (p: IconProps) => (
  <SealCard bg="#1D4ED8" fg="#fff" Icon={BadgeCheck} line1="LGPD" line2="COMPLIANT" title="LGPD" {...p} />
);
export const HttpsIcon = (p: IconProps) => (
  <SealCard bg="#111827" fg="#22c55e" Icon={Lock} line1="HTTPS" line2="SECURE" title="HTTPS" {...p} />
);
export const ComodoIcon = (p: IconProps) => (
  <SealCard bg="#fff" fg="#CE0E2D" Icon={ShieldCheck} line1="COMPRA" line2="SEGURA" title="Compra Segura" {...p} />
);
export const SecureCheckoutIcon = (p: IconProps) => (
  <SealCard bg="#0F172A" fg="#fff" Icon={ShoppingBag} line1="SECURE" line2="CHECKOUT" title="Secure Checkout" {...p} />
);
export const VerifiedStoreIcon = (p: IconProps) => (
  <SealCard bg="#fff" fg="#0F172A" Icon={Store} line1="VERIFIED" line2="STORE" title="Verified Store" {...p} />
);
export const BuyerProtectionIcon = (p: IconProps) => (
  <SealCard bg="#fff" fg="#0F172A" Icon={HandCoins} line1="BUYER" line2="PROTECTION" title="Buyer Protection" {...p} />
);

/* ---------- Registry ---------- */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const PAYMENT_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  visa: VisaIcon,
  mastercard: MastercardIcon,
  master: MastercardIcon,
  amex: AmexIcon,
  americanexpress: AmexIcon,
  elo: EloIcon,
  hipercard: HipercardIcon,
  pix: PixIcon,
  boleto: BoletoIcon,
  boletobancario: BoletoIcon,
  paypal: PaypalIcon,
  diners: DinersIcon,
  dinersclub: DinersIcon,
  discover: DiscoverIcon,
  googlepay: GooglePayIcon,
  gpay: GooglePayIcon,
  applepay: ApplePayIcon,
};

export const SECURITY_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  ssl: SslIcon,
  sslseguro: SslIcon,
  siteseguro: SiteSeguroIcon,
  site: SiteSeguroIcon,
  lgpd: LgpdIcon,
  https: HttpsIcon,
  comodo: ComodoIcon,
  comodosecure: ComodoIcon,
  comprasegura: ComodoIcon,
  securecheckout: SecureCheckoutIcon,
  checkoutseguro: SecureCheckoutIcon,
  verifiedstore: VerifiedStoreIcon,
  lojaverificada: VerifiedStoreIcon,
  buyerprotection: BuyerProtectionIcon,
  protecaocomprador: BuyerProtectionIcon,
};

export function PaymentBadge({ name, className }: { name: string; className?: string }) {
  const Icon = PAYMENT_ICONS[norm(name)];
  if (Icon) return <Icon className={className} />;
  return (
    <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded border bg-background">
      {name}
    </span>
  );
}

export function SecurityBadge({ name, className }: { name: string; className?: string }) {
  const Icon = SECURITY_ICONS[norm(name)];
  if (Icon) return <Icon className={className} />;
  return (
    <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded border bg-background">
      {name}
    </span>
  );
}
