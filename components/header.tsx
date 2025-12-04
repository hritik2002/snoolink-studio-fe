import Link from "next/link";

export default function Header() {
  return (
    <div className="flex gap-4 bg-gray-100 p-4 justify-center">
      <Link className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer" href="/">
        Home
      </Link>
      <Link className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer" href="/search">
        Search
      </Link>
      <Link className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer" href="/upload">
        Upload
      </Link>
      <Link className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer" href="/generate">
        Generate
      </Link>
    </div>
  );
}
