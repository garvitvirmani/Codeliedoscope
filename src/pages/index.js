import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [cityStoreInfo, setCityStoreInfo] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/result");
        const data = await response.json();
        setCityStoreInfo(data?.cityStoreInfo);
      } catch (error) {
        console.error("An error occurred:", error);
      }
    };

    fetchData();
  }, []);

  const card = (data) => {
    return (
      data?.latitude?.length > 0 && (
        <div class="ag-courses_item">
          <a class="ag-courses-item_link">
            <div class="ag-courses-item_bg"></div>

            <div class="ag-courses-item_title">{data?.name}</div>

            <div class="ag-courses-item_date-box">{data?.address}</div>
            <div class="ag-courses-item_date-box">
              <span class="ag-courses-item_date">
                {`Cordinates: ${data?.latitude},${data?.longitude}`}
              </span>
            </div>
          </a>
        </div>
      )
    );
  };
  return (
    <div class="ag-format-container">
      <div class="ag-courses_box">
        {cityStoreInfo?.length > 0 ? (
          cityStoreInfo?.map((e) => (
            <div className="section">
              <div class="city">{e?.city}</div>
              {e.stores.map((store) => card(store))}
            </div>
          ))
        ) : (
          <div class="loader-css">
            <div class="loader"></div>
            <div>scraping stores this may take a while ...</div>
          </div>
        )}
      </div>
    </div>
  );
}
