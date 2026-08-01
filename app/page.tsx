import Image from "next/image";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID);
  return (
    <main className="login-shell">
      {reason === "device-limit" && (
        <div className="login-alert-backdrop" role="presentation">
          <section className="login-alert" role="alertdialog" aria-modal="true" aria-labelledby="device-limit-title">
            <span className="login-alert-icon" aria-hidden="true">!</span>
            <h2 id="device-limit-title">เข้าสู่ระบบไม่ได้</h2>
            <p>บัญชีนี้ใช้งานครบจำนวนอุปกรณ์ที่กำหนดแล้ว</p>
            <small>กรุณาติดต่อคุณครูเพื่อนำอุปกรณ์เครื่องเก่าออก แล้วจึงลองเข้าสู่ระบบอีกครั้ง</small>
            <Link className="login-alert-close" href="/">รับทราบ</Link>
          </section>
        </div>
      )}
      <div className="blob blob-a" aria-hidden="true" />
      <div className="blob blob-b" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-panel">
          <span className="brand-chip">✦ พื้นที่เรียนออนไลน์ส่วนตัว</span>
          <Image className="mascot" src="/kru-pim-mascot.png" alt="กระต่ายสีขาวใส่โบว์ชมพู ถือสมุด" width={700} height={700} priority />
          <div className="brand-copy">
            <span className="eyebrow">เรียนได้ทุกที่ ในเวลาของตัวเอง</span>
            <h1 id="login-title">Kru Pim <em>E-learning</em></h1>
            <p>บทเรียน วิดีโอ และเอกสารที่คุณครูเตรียมไว้สำหรับนักเรียนแต่ละคนโดยเฉพาะ</p>
          </div>
        </div>
        <div className="signin-panel">
          <div className="signin-content">
            <div className="mini-logo" aria-hidden="true">KP</div>
            <span className="eyebrow">ยินดีต้อนรับกลับมา</span>
            <h2>เข้าสู่พื้นที่เรียนของคุณ</h2>
            <p className="muted">กรุณาใช้บัญชี Gmail ที่คุณครูเพิ่มไว้ในระบบเท่านั้น</p>
            {googleReady ? (
              <a className="google-button" href="/api/auth/google"><b>G</b>เข้าสู่ระบบด้วย Google</a>
            ) : (
              <button className="google-button" type="button" disabled><b>G</b>รอเชื่อมต่อ Google Login</button>
            )}
            <Link className="public-profile-link" href="/about"><span className="public-profile-icon"><Image src="/rabbit-icon-192.png" width={48} height={48} alt=""/></span><span className="public-profile-copy"><b>รู้จักครูพิม</b><small>ดูประวัติ แนวทางการสอน และผลงานนักเรียน</small></span><span className="public-profile-cta">ดูเลย <i>→</i></span></Link>
            <div className="trust-list">
              <p><i>✓</i> เข้าได้เฉพาะ Gmail ที่ได้รับอนุญาต</p>
              <p><i>✓</i> จำกัดอุปกรณ์ตามที่คุณครูกำหนด</p>
              <p><i>✓</i> เนื้อหามีลายน้ำเฉพาะบุคคล</p>
            </div>
            <Link className="demo-link" href="/demo">ดูตัวอย่างพื้นที่เรียน <span>→</span></Link>
          </div>
          <small className="privacy-note">การเข้าสู่ระบบถือว่าคุณรับทราบนโยบายความเป็นส่วนตัวและเงื่อนไขการใช้สื่อการเรียน</small>
        </div>
      </section>
    </main>
  );
}
