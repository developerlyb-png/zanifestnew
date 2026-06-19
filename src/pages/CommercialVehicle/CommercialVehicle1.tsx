"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/commercialvehicle1.module.css";
import Image from "next/image";
import vehicle from "@/assets/CommercialVehicle/Layer 1.png";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import VehicleInfoDialog from "@/pages/CommercialVehicle/VehicleInfoDialog";
import ChooseVehicleDialog from "@/pages/CommercialVehicle/ChooseVehicleDialog";
import VehicleBrandDialog from "@/pages/CommercialVehicle/VehicleBrandDialog";
import VehicleModelDialog from "@/pages/CommercialVehicle/VehicleModelDialog";
import VehicleVariantDialog from "@/pages/CommercialVehicle/VehicleVariantDialog";
import YearDialog from "@/pages/CommercialVehicle/YearDialog";
import RtoDialog from "@/pages/CommercialVehicle/RtoDialog";

const CommercialVehicle1: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    | "vehicleInfo"
    | "chooseVehicle"
    | "vehicleBrand"
    | "vehicleModel"
    | "vehicleVariant"
    | "yearDialog"
   |"CommercialVehicle1"
|"rtoDialog"
|null
  >(null);

  // ✅ Selection states
  const [vehicleNumber, setVehicleNumber] = useState("DL01LAG8279");
  const [selectedVehicle, setSelectedVehicle] = useState("Truck");
 const [selectedBrand,setSelectedBrand] =
useState<string | null>(null);

const [selectedModel,setSelectedModel] =
useState<string | null>(null);

const [selectedVariant,setSelectedVariant] =
useState<string | null>(null);
  const [selectedYear, setSelectedYear] =
useState<number | null>(null);
const [selectedRto,setSelectedRto] =
useState<any>(null);
const [vehicleIdvDetails,setVehicleIdvDetails] =
useState<any>(null);
const [isNewVehicle,setIsNewVehicle] =
useState(false);

const fetchIdvDetails = async(rto:any)=>{


try{


const params =
new URLSearchParams({

make:String(selectedBrand),

model:String(selectedModel),

variant:String(selectedVariant),

city:
String(
rto.idvCity ||
rto.idvcity ||
rto.idv_city ||
rto.city
)

});



const res =
await fetch(
`/api/zuno/cv/idv?${params}`
);



const data =
await res.json();



console.log(
"CV IDV DETAILS",
data
);



setVehicleIdvDetails(data);



localStorage.setItem(

"cvIdvDetails",

JSON.stringify(data)

);



}
catch(error){

console.log(
"IDV ERROR",
error
);

}


};
  return (
    <>
      <Navbar />

      {/* Main Section */}
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {/* Left Section */}
          <div className={styles.left}>
            <span className={styles.badge}>GET POLICY IN 2 MINUTES</span>
            <h2 className={styles.title}>
              Commercial Vehicle Insurance <br />
              starting at <span className={styles.price}>₹3,139</span>
            </h2>
            <input
              type="text"
              placeholder="Enter Vehicle Number: (eg. DL-10-CB-1234)"
              className={styles.input}
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
           <p className={styles.linkText}>
 Brand new vehicle? 
 <a
 href="#"
 onClick={(e)=>{

 e.preventDefault();

 setIsNewVehicle(true);

setVehicleNumber(
"Brand New"
);
 setSelectedBrand(null);
 setSelectedModel(null);
 setSelectedVariant(null);
 setSelectedYear(null);
 setSelectedRto(null);

 setActiveSection(
 "chooseVehicle"
 );

 }}
 >
 Click here
 </a>
</p>
          </div>

          {/* Right Section */}
          <div className={styles.right}>
            <Image
              src={vehicle}
              alt="Commercial Vehicle"
              className={styles.truckImg}
            />
            <button
 className={styles.button}
 onClick={()=>{

setIsNewVehicle(false);

setActiveSection(
"chooseVehicle"
);

}}
>
 View Prices
</button>
          </div>
        </div>
      </div>

      {/* Dialog Handling */}
      {activeSection === "vehicleInfo" && (
       <VehicleInfoDialog

onClose={() => setActiveSection(null)}

oncommercialvehicle1={() => setActiveSection("CommercialVehicle1")}

onChooseVehicle={() => setActiveSection("chooseVehicle")}

onChooseBrand={() => setActiveSection("vehicleBrand")}

onChooseModel={() => setActiveSection("vehicleModel")}

onChooseFuelVariant={() => setActiveSection("vehicleVariant")}

onChooseYear={() => setActiveSection("yearDialog")}


vehicleNumber={vehicleNumber}

selectedVehicle={selectedVehicle}

selectedBrand={selectedBrand}

selectedModel={selectedModel}

selectedVariant={selectedVariant}

selectedYear={selectedYear}


// ADD THIS
selectedRto={selectedRto}


onUpdateData={(data)=>{

if(data.vehicle) setSelectedVehicle(data.vehicle);

if(data.brand) setSelectedBrand(data.brand);

if(data.model) setSelectedModel(data.model);

if(data.variant) setSelectedVariant(data.variant);

if(data.year) setSelectedYear(data.year);

}}

/>
      )}
      {activeSection === "chooseVehicle" && (
        <ChooseVehicleDialog
          onClose={() => setActiveSection(null)}
          onSelectVehicle={(v) => {
            setSelectedVehicle(v);
            setActiveSection("vehicleBrand");
          }}
          onBackToInfo={() => setActiveSection("vehicleInfo")}
          onNextToBrand={() => setActiveSection("vehicleBrand")}
        />
      )}

      {activeSection === "vehicleBrand" && (
        <VehicleBrandDialog
          onClose={() => setActiveSection(null)}
          onBackToChooseVehicle={() => setActiveSection("chooseVehicle")} 
          onNextToVehicleModel={() => setActiveSection("vehicleModel")}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
         onSelectBrand={(brand)=>{

setSelectedBrand(brand);

setSelectedModel(null);
setSelectedVariant(null);

setActiveSection(
"vehicleModel"
);

}}
        />
      )}

      {activeSection === "vehicleModel" && selectedBrand && (
        <VehicleModelDialog
          onBack={() => setActiveSection("vehicleBrand")}
          onNext={() => setActiveSection("vehicleVariant")}
          onClose={() => setActiveSection(null)}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
         onSelectModel={(model)=>{

setSelectedModel(model);

setSelectedVariant(null);

setActiveSection(
"vehicleVariant"
);

}}
        />
      )}

      {activeSection === "vehicleVariant" && selectedBrand && selectedModel && (
        <VehicleVariantDialog
          onBackToModel={() => setActiveSection("vehicleModel")} // 👈 back
          onNextToYear={() => setActiveSection("yearDialog")}
          onClose={() => setActiveSection(null)}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
         onSelectVariant={(variant)=>{


setSelectedVariant(
variant
);



if(isNewVehicle){


setActiveSection(
"rtoDialog"
);


}
else{


setActiveSection(
"yearDialog"
);


}



}}
        />
      )}
{activeSection==="rtoDialog" &&
selectedBrand &&
selectedModel &&
selectedVariant && (

<RtoDialog

onBack={()=>
setActiveSection("vehicleVariant")
}

onClose={()=>
setActiveSection(null)
}


vehicleNumber={vehicleNumber}

selectedVehicle={selectedVehicle}

selectedBrand={selectedBrand}

selectedModel={selectedModel}

selectedVariant={selectedVariant}


onSelectRto={async(rto)=>{


console.log(
"SELECTED RTO DATA",
rto
);



setSelectedRto(
rto
);



// save for quote payload

localStorage.setItem(

"cvRtoDetails",

JSON.stringify({

rtoLocationName:
rto.rtolocation,


rtoStateCode:
Number(rto.statecode),


rtoCityOrDistrict:
rto.rtocityordistrict,


idvCity:
rto.idvcity,


clusterZone:
rto.clusterzone,


carZone:
rto.carzone,


rtoZone:
"Except E Cart"


})

);





await fetchIdvDetails(
rto.idvcity
);




setActiveSection(
"yearDialog"
);



}}

/>

)}
      {activeSection === "yearDialog" &&
        selectedBrand &&
        selectedModel &&
        selectedVariant && (
          <YearDialog
            onBack={() => setActiveSection("vehicleVariant")} // 👈 go back
            onClose={() => setActiveSection(null)}
            vehicleNumber={vehicleNumber}
            selectedVehicle={selectedVehicle}
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedVariant={selectedVariant}
           onSelectYear={(year)=>{

setSelectedYear(year);


localStorage.setItem(
"cvVehicle",
JSON.stringify({

vehicleNumber:vehicleNumber,

claimInLastYearPolicy:"N",

yearOfPurchase:String(year),

make:selectedBrand,

model:selectedModel,

varient:selectedVariant,


rtoDetails:
isNewVehicle
?
selectedRto
:
null


})
);

setActiveSection(
"vehicleInfo"
);

}}
          />
        )}

      <Footer />
    </>
  );
};

export default CommercialVehicle1;
