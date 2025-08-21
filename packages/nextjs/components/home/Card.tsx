import React from "react";
import Link from "next/link";
import ArrowRight from "../assets/ArrowRight";
import { cn } from "~~/utils/classNames";

function Card({
  title,
  description,
  link,
  index,
}: {
  title: string;
  description: string;
  link: string;
  index: number;
}) {
  const styles = ["bg-brand-orange", "bg-brand-pink", "bg-brand-green", "bg-white"];
  return (
    <div className="flex flex-col gap-2 border border-white rounded-xl px-4 pt-4 w-[310px]">
      <h2 className={cn(`text-2xl font-bold w-max px-1 text-black`, styles[index])}>{title}</h2>
      <div className="flex flex-1 justify-between mt-1">
        <p className="m-0 text-sm mb-4">{description}</p>
        <div className="flex items-end flex-1 justify-end">
          <div className="relative h-10 mb-2">
            <Link
              href={link}
              target={link.startsWith("http") ? "_blank" : undefined}
              className="bg-primary rounded-full relative hover:border-white text-white font-bold rounded-3xl! border w-10 h-8 after:w-10 after:h-8 after:rounded-3xl after:-z-10 after:mt-2 after:ml-2 after:absolute after:border flex justify-center items-center"
            >
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;
