'use client';

export default function CTABanner() {
  return (
    <section className="py-8 bg-[#ece97f]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-normal font-sans text-black text-center md:text-left">
              Any Questions or Doubts? Don&apos;t hesitate to chat with us!
            </h2>
          </div>
          <div className="flex-shrink-0">
            <a
              href="https://wa.link/cqy47y"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-[#ece97f] text-black font-bold uppercase border-2 border-black rounded-md hover:bg-black hover:text-[#ece97f] transition-colors duration-200"
            >
              Chat Now!
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
