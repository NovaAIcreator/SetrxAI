// Logo.jsx
// SetrxAI ka logo — real image use karta hai (public/logo.png)

export default function Logo({ size = 32 }) {
  return (
    <img
      src="/logo.png"
      alt="SetrxAI"
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: '25%' }}
      className="object-cover shadow-md"
    />
  );
}