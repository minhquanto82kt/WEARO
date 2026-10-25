import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Về WEARO — Mặc theo cách của riêng bạn" },
      { name: "description", content: "WEARO là cửa hàng thời trang trực tuyến tích hợp AI Virtual Try-On, AI Stylist và Hybrid Stylist 1:1." },
      { property: "og:title", content: "WEARO — Mặc theo cách của riêng bạn" },
      { property: "og:description", content: "Thời trang cá nhân hóa với AI Virtual Try-On, AI Stylist và tư vấn Stylist 1:1." },
    ],
  }),
  component: AboutPage,
});

const STATS = [
  { k: "AI", v: "Virtual Try-On trên ảnh thật" },
  { k: "SET", v: "Full-Set Outfit cá nhân hóa" },
  { k: "1:1", v: "Hybrid Stylist tư vấn trực tiếp" },
];

const SOLUTIONS = [
  {
    no: "01",
    label: "VIRTUAL TRY-ON",
    title: "Thấy mình trong đồ.",
    body: "Tải ảnh toàn thân và xem trang phục được ghép trực tiếp lên ảnh của chính bạn trước khi quyết định mua.",
  },
  {
    no: "02",
    label: "AI STYLIST",
    title: "Mua cả một outfit.",
    body: "AI phân tích vóc dáng, tone màu và bối cảnh để đề xuất Full-Set gồm áo, quần/chân váy và phụ kiện.",
  },
  {
    no: "03",
    label: "HYBRID STYLIST",
    title: "AI gợi ý, người thật tinh chỉnh.",
    body: "Stylist hỗ trợ 1:1 qua chat để kiểm duyệt outfit, tư vấn phụ kiện và chọn size khi khách hàng cần thêm góc nhìn chuyên môn.",
  },
];

const DESIGN_TOKENS = [
  { k: "01", title: "Palette", value: "SLATE BLUE / DUSTY BLUE / PEACH", detail: "#54728C · #7794A6 · #F2CEAE · #D9BBA9 · #F2AD94" },
  { k: "02", title: "Typography", value: "MODERN + EDITORIAL", detail: "H1 Space Grotesk 700; H2/H3 Be Vietnam Pro 600/500; paragraph & quote Lexend 400." },
  { k: "03", title: "Layout", value: "SPACE / GRID / BALANCE", detail: "Bố cục bất đối xứng, hình ảnh lớn, khoảng thở rộng và đường viền nhẹ." },
  { k: "04", title: "Interaction", value: "DIRECT / TACTILE / CLEAR", detail: "CTA có thứ bậc rõ và trạng thái tương tác dễ nhận biết." },
];

function AboutPage() {
  return (
    <div className="min-h-screen wearo-page wearo-about-page">
      <SiteNav />
      <main className="wearo-about">
        <section className="wearo-about__masthead" aria-labelledby="about-title">
          <div className="wearo-about__masthead-copy">
            <p className="wearo-about__kicker">WEARO / ABOUT / 2026</p>
            <h1 id="about-title">Mặc theo cách của <em>riêng bạn.</em></h1>
            <p className="wearo-about__intro">Một hệ sinh thái thời trang unisex nơi công nghệ AI giúp bạn nhìn thấy, hiểu và định hình phong cách của chính mình.</p>
            <div className="wearo-about__actions">
              <Link to="/shop" className="wearo-about__button">Khám phá WEARO</Link>
              <Link to="/ai" className="wearo-about__button wearo-about__button--ghost">Thử AI Virtual Try-On</Link>
            </div>
          </div>
          <div className="wearo-about__masthead-meta">
            <span>FROM CHOOSING CLOTHES<br />TO OWNING YOUR STYLE.</span>
            <span>UNISEX / AI / PERSONAL STYLE</span>
          </div>
        </section>

        <section className="wearo-about__editorial-grid" aria-label="WEARO overview">
          <article className="wearo-about__image-card">
            <img
              src="/images/stylish_urban_girl.jpg"
              alt="Người phụ nữ mặc blazer màu be thư giãn tại quán cà phê, thể hiện phong cách đời thường hiện đại"
            />
            <div className="wearo-about__image-caption">
              <span>WEARO / BRAND STORY</span>
              <strong>STYLE LIVES EVERYWHERE.</strong>
            </div>
          </article>

          <article className="wearo-about__value-card">
            <p className="wearo-about__eyebrow">Core value proposition</p>
            <blockquote>
              “WEARO — Mặc theo cách của riêng bạn: Định hình phong cách cá nhân với Thử đồ ảo AI chuẩn dáng.”
            </blockquote>
            <p>
              Dành cho người trẻ và người đi làm bận rộn từ 16–30 tuổi, WEARO kết hợp AI Virtual Try-On và AI Stylist để giảm nỗi lo mua sai form, rút ngắn thời gian phối đồ và giúp khách hàng tự tin thể hiện bản sắc riêng.
            </p>
          </article>

          <article className="wearo-about__stats-card">
            {STATS.map((stat) => (
              <div key={stat.k} className="wearo-about__stat">
                <strong>{stat.k}</strong>
                <span>{stat.v}</span>
              </div>
            ))}
          </article>

          <article className="wearo-about__story-card">
            <p className="wearo-about__eyebrow">WEAR + O</p>
            <h2>Own. Original. Open.</h2>
            <p>
              WEAR đại diện cho trang phục và cách bạn thể hiện gu ăn mặc mỗi ngày. O mở ra ba tinh thần: <strong>Own</strong> — làm chủ phong cách; <strong>Original</strong> — giữ bản sắc nguyên bản; và <strong>Open</strong> — cởi mở với những xu hướng mới.
            </p>
          </article>
        </section>

        <section className="wearo-about__problem">
          <div>
            <p className="wearo-about__eyebrow">The problem</p>
            <h2>Mua online không nên là một canh bạc.</h2>
          </div>
          <p>
            Khách hàng thường khó hình dung một món đồ sẽ trông như thế nào trên chính cơ thể mình, đồng thời mất thời gian phối từng món riêng lẻ. WEARO tập trung giải quyết hai pain point đó: <strong>an tâm khi chọn đồ</strong> và <strong>tiết kiệm thời gian khi phối đồ</strong>.
          </p>
        </section>

        <section className="wearo-about__solutions" aria-labelledby="solution-title">
          <div className="wearo-about__section-head">
            <div>
              <p className="wearo-about__eyebrow">The WEARO solution</p>
              <h2 id="solution-title">Technology that gets out of the way.</h2>
            </div>
            <span>01 — 03</span>
          </div>
          <div className="wearo-about__solution-grid">
            {SOLUTIONS.map((solution) => (
              <article key={solution.no} className="wearo-about__solution">
                <div className="wearo-about__solution-top">
                  <span>{solution.no}</span>
                  <small>{solution.label}</small>
                </div>
                <h3>{solution.title}</h3>
                <p>{solution.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="design-language" className="wearo-about__system" aria-labelledby="design-language-title">
          <div className="wearo-about__section-head">
            <div>
              <p className="wearo-about__eyebrow">Design language</p>
              <h2 id="design-language-title">The visual system behind WEARO.</h2>
            </div>
            <span>WEARO / UI SYSTEM 01</span>
          </div>

          <p className="wearo-about__system-lede">
            Casual, modern, unisex — một hệ thống thị giác giữ trải nghiệm nhất quán từ trang chủ, catalogue, AI Studio đến checkout.
          </p>

          <div className="wearo-about__token-grid">
            {DESIGN_TOKENS.map((item) => (
              <article key={item.k}>
                <div><span>{item.k}</span><small>{item.title}</small></div>
                <h3>{item.value}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="wearo-about__palette" aria-label="WEARO five-color palette">
            <div className="wearo-swatch wearo-swatch--slate"><span>SLATE BLUE</span><small>#54728C</small></div>
            <div className="wearo-swatch wearo-swatch--dusty"><span>DUSTY BLUE</span><small>#7794A6</small></div>
            <div className="wearo-swatch wearo-swatch--peach"><span>PEACH</span><small>#F2CEAE</small></div>
            <div className="wearo-swatch wearo-swatch--beige"><span>BEIGE</span><small>#D9BBA9</small></div>
            <div className="wearo-swatch wearo-swatch--coral"><span>CORAL</span><small>#F2AD94</small></div>
          </div>
        </section>

        <section className="wearo-about__closing">
          <p className="wearo-about__eyebrow">WEARO / 2026</p>
          <h2>Không chỉ chọn đồ.<br /><em>Chọn cách bạn xuất hiện.</em></h2>
          <p>WEARO biến quyết định mặc gì mỗi ngày thành một trải nghiệm cá nhân, trực quan và có chủ đích.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
