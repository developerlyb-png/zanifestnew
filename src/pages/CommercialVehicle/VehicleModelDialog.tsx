"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/pages/CommercialVehicle/VehicleModelDialog.module.css";
import { FiMapPin, FiEdit2, FiSearch } from "react-icons/fi";
import { FaTruck, FaCar } from "react-icons/fa";

interface VehicleModelDialogProps {
  onClose: () => void;
    onBack: () => void;   
  onNext: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  selectedBrand: string;
  onSelectModel: (model: string) => void;
}

const VehicleModelDialog: React.FC<VehicleModelDialogProps> = ({
  onClose,
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  onSelectModel,
   onBack,
  onNext,
}) => {
  const [search, setSearch] = useState("");
const [models,setModels] = useState<string[]>([]);
useEffect(()=>{

if(selectedBrand){

getModels();

}

},[selectedBrand]);




const getModels = async()=>{

try{


const res =
await axios.get(
`/api/zuno/cv/model?make=${selectedBrand}`
);


console.log(
"CV MODELS",
res.data
);



const modelList =
res.data.map(
(item:any)=> item.model
);


setModels(modelList);



}
catch(error){

console.log(
"MODEL ERROR",
error
);

}

};
  // const models = [
  //   "TRAX",
  //   "MATADOR",
  //   "TEMPO",
  //   "TEMPO TRAVELLER",
  //   "TEMPO TRAX",
  //   "TRAVELLER",
  //   "LPT 709"
  // ];

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Section */}
        <div className={styles.left}>
          <h3 className={styles.leftTitle}>Your selection</h3>
          <div className={styles.selectionBox}>
            <div className={styles.selectionItem}>
              <FiMapPin className={styles.icon} /> {vehicleNumber}
            </div>
            <div className={styles.selectionItem}>
              <FaTruck className={styles.icon} /> {selectedVehicle}
            </div>
            <div className={styles.selectionItem}>
              <FaCar className={styles.icon} /> {selectedBrand}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.right}>
          <div className={styles.header}>
            <button className={styles.arrowBtn} onClick={onBack}>
              ‹
            </button>
            <span>Search Vehicle Model</span>
            <button className={styles.arrowBtn} onClick={onNext}>
              ›
            </button>            
          </div>

          {/* Search Bar */}
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Vehicle Model"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Models List */}
          <div className={styles.modelsGrid}>
            {models
              .filter((m) =>
                m.toLowerCase().includes(search.toLowerCase())
              )
              .map((model, i) => (
                <button
 key={i}
 className={styles.modelBtn}
 onClick={() => 
  onSelectModel(
   model.replaceAll('"',"").trim()
  )
 }
>

{
model.replaceAll('"',"").trim()
}

<span className={styles.arrow}>›</span>

</button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleModelDialog;