import Image from "next/image";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-white backdrop-blur-md border-x border-gray-300 mx-[40px]">
      <Hero />
    </div>
  );
}