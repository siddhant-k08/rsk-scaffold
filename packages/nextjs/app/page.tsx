"use client";

import type { NextPage } from "next";
import CubeImg from "~~/components/assets/CubeImg";
import CardContainer from "~~/components/home/CardContainer";
import Title from "~~/components/home/Title";
import Badge from "~~/components/ui/Badge";

const Home: NextPage = () => {
  return (
    <>
      <div className="mt-10 max-w-screen-lg xl:max-w-screen-xl mx-auto">
        <div className="px-5 flex justify-between items-start">
          <div>
            <Title />
            <div className="flex gap-2 flex-col mt-16">
              <div className="flex gap-2">
                <Badge type="number">1</Badge>
                <Badge>Get Started</Badge>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  Get started by editing <Badge type="code">packages/nextjs/app/page.tsx</Badge>
                </div>
                <div className="flex items-center gap-1">
                  Edit your smart contract <Badge type="code">YourContract.sol</Badge> in
                  <Badge type="code">packages/hardhat/contracts</Badge>
                </div>
              </div>
            </div>
          </div>
          <CubeImg />
        </div>
        <CardContainer />
      </div>
    </>
  );
};

export default Home;
