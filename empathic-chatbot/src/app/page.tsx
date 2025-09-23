import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1>
          WE ARE EMPATHY GROUP 1
        </h1>
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          
          <h3 className="tracking-[-.01em]">
            Click to go to our empathic chatbot
          </h3>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/chatbot"
            target="_blank"
            rel="noopener noreferrer"
          >
            
            Go to the chatbot
          </a>
          
        </div>
      </main>
      
    </div>
  );
}
