"use client";

import React, { useState, useEffect } from "react";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import styles from "@/styles/pages/carinsurance.module.css";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import { useRouter } from "next/router";
import AOS from "aos";


import VehicleBrandDialog from "./Carbrand";
import VehicleModelDialog from "./Carmodel";
import VehicleVariantDialog from "./CarVariant";
import VehicleInfoDialog from "./CarInfoDialog";
import SelectFuelType from "./Selectfueltype";
import CarYearDialog from "./CarYearDialog";
import ChoosecarDialog from "./Location";
function Carinsurance() {
  const router = useRouter();

  const [carNumber, setCarNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<
    | "none"
    | "chooseYear"
    | "chooseLocation"
    | "chooseBrand"
    | "chooseModel"
    | "selectfueltype"
    | "chooseVariant"
    | "vehicleInfo"
>("none");

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const [selectedFuel, setSelectedFuel] = useState<string | null>(null);

  const [rcDetails, setRcDetails] = useState<any>(null);

  // FIXED LOCATION
  const [selectedLocation,setSelectedLocation] =
useState<any>({

state:"",
rto:""

});

const [selectedYear,setSelectedYear] =
useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

const handleRCVerify = async () => {


const reg = carNumber.toUpperCase().trim();


if(!reg){

alert("Please enter vehicle number");

return;

}


setLoading(true);


try{


const response = await fetch(

"/api/vahan/4w/rc-check",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

registrationNumber:reg

})

}

);



const result = await response.json();



console.log(
"RechargeKit VAHAN RESULT",
result
);




// ======================
// SUCCESS AUTO FILL
// ======================

if(result.success){



const data =
result.data;

setRcDetails(data);

console.log(
"FULL RC DATA",
JSON.stringify(data,null,2)
);

console.log(
"RechargeKit VEHICLE DATA",
data
);



setSelectedBrand(

data?.vehicle_manufacturer_name ||
""

);


// ======================
// MODEL + VARIANT SPLIT
// ======================
// ======================
// MODEL + VARIANT SPLIT
// ======================

const fullModel =
data?.model || "";


let carModel = "";
let carVariant = "";


// Hyundai Grand i10 Nios

if(
fullModel
.toLowerCase()
.includes("grandi10nios")
){

carModel =
"Grand i10 Nios";


carVariant =
fullModel
.replace(/grandi10nios/i,"")
.replace(/([0-9])/g," $1")
.replace(/mt/i," MT ")
.replace(/amt/i," AMT ")
.replace(/kappa/i," Kappa ")
.replace(/sportz/i," Sportz")
.replace(/magna/i," Magna")
.replace(/asta/i," Asta")
.trim();

}

else{

const cleanModel =
fullModel
.replace(/([a-z])([A-Z])/g,"$1 $2")
.replace(/([0-9])/g," $1");


const modelArray =
cleanModel.split(" ");


carModel =
modelArray
.slice(0,3)
.join(" ");


carVariant =
modelArray
.slice(3)
.join(" ");

}



setSelectedModel(
carModel
);


setSelectedVariant(
carVariant
);
// ======================
// FUEL
// ======================


setSelectedFuel(

data?.type ||
data?.fuel_type ||
data?.vehicle_fuel_description ||
data?.fuel ||
""

);


setSelectedYear(

Number(

data?.vehicle_manufacturing_month_year
?.split("/")
?.[1]

)

);




setSelectedLocation({

state:"",

rto:
data?.reg_authority ||
reg.substring(0,4)

});



// directly show info screen

setStep("vehicleInfo");


}




// ======================
// FAILED MANUAL FLOW
// ======================

else{


alert(
"Vehicle not found please select manually"
);



setSelectedLocation({

state:"",

rto:reg.substring(0,4)

});



setStep("chooseYear");


}



}


catch(error){



console.log(
"ZUNO VAHAN ERROR",
error
);



alert(
"API failed select manually"
);



setSelectedLocation({

state:"",

rto:reg.substring(0,4)

});



setStep("chooseYear");


}



finally{


setLoading(false);


}


};

  return (
    <div>
      <UserDetails />

      <Navbar />

      <div className={styles.cont}>
        <div className={styles.imageCont}>
          <Image
            src={require("@/assets/pageImages/blackcar.png")}
            alt="car"
            className={styles.image}
          />
        </div>

        <div className={styles.bottom}>
          <p className={styles.heading}>
            Compare &<b className={styles.bold}>save upto 90%</b>
            on car insurance
          </p>

          <div className={styles.form}>
            <input

className={styles.input}

type="text"

value={carNumber}

onChange={(e)=> 
setCarNumber(e.target.value.toUpperCase())
}

placeholder="Enter car number (eg - DL10AB1234)"

/>
<button

className={styles.button}

onClick={handleRCVerify}

>              {loading ? (
                "Checking..."
              ) : (
                <>
                  View Prices <FaArrowRight />
                </>
              )}
            </button>

            <div className={styles.newCar}>
              Brand new car?{" "}
              <button
                className={styles.linkBtn}
                // CHANGED
                onClick={() => setStep("chooseYear")}
              >
                click here
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* YEAR SCREEN */}

      {step === "chooseYear" && (
        <CarYearDialog
          location={selectedLocation}
          onClose={() => {
            setStep("none");
          }}
          onEditLocation={() => {
    setStep("chooseLocation");
}}
          onSelectYear={(year:string)=>{

 if(year==="Brand New Car"){
   setSelectedYear(new Date().getFullYear());
 }
 else{
   setSelectedYear(Number(year));
 }

 setStep("chooseBrand");

}}
        />
      )}

      {/* LOCATION SCREEN */}

      {step === "chooseLocation" && (

<ChoosecarDialog

onClose={() => {
 setStep("chooseYear")
}}


onSelectVehicle={(location:any)=>{


setSelectedLocation(location);


setStep("chooseYear");


}}


/>

)}

      {/* BRAND */}

   {step === "chooseBrand" && (

<VehicleBrandDialog

onClose={() => setStep("none")}

vehicleNumber={carNumber || "NEW VEHICLE"}

selectedVehicle={selectedVehicle || ""}

selectedYear={selectedYear}

selectedLocation={selectedLocation}


onSelectBrand={(brand) => {

setSelectedBrand(brand);

setSelectedModel(null);

setSelectedFuel(null);

setSelectedVariant(null);

setStep("chooseModel");

}}


onBackToChooseVehicle={() => 
setStep("chooseYear")
}


onNextToVehicleModel={() =>
setStep("chooseModel")
}

/>

)}
      {/* MODEL */}

      {step === "chooseModel" && (
        <VehicleModelDialog
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle || ""}
          selectedBrand={selectedBrand || ""}
          selectedYear={selectedYear}
selectedLocation={selectedLocation}
          onSelectModel={(model) => {
            setSelectedModel(model);

            setSelectedFuel(null);

            setSelectedVariant(null);

            setStep("selectfueltype");
          }}
          onBack={() => setStep("chooseBrand")}
          onNext={() => setStep("selectfueltype")}
        />
      )}

      {/* FUEL */}

      {step === "selectfueltype" && (
        <SelectFuelType
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle || ""}
          selectedBrand={selectedBrand || ""}
          selectedModel={selectedModel || ""}
          selectedVariant={selectedVariant || ""}
          selectedFuel={selectedFuel || ""}
          selectedYear={selectedYear}
selectedLocation={selectedLocation}
          onBackToModel={() => setStep("chooseModel")}
          onSelectFuel={(fuel) => {
            setSelectedFuel(fuel);

            setStep("chooseVariant");
          }}
          onNextToVariant={() => setStep("chooseVariant")}
        />
      )}

      {/* VARIANT */}

      {step === "chooseVariant" && (
        <VehicleVariantDialog
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle || ""}
          selectedBrand={selectedBrand || ""}
          selectedModel={selectedModel || ""}
          selectedFuel={selectedFuel || ""}
          selectedYear={selectedYear}
selectedLocation={selectedLocation}
          onBackToModel={() => setStep("selectfueltype")}
          onSelectVariant={(variant) => {
            setSelectedVariant(variant);

            setStep("vehicleInfo");
          }}
        />
      )}

      {/* FINAL INFO */}

      {step === "vehicleInfo" && (
  <VehicleInfoDialog

    onClose={() => setStep("none")}

    vehicleNumber={carNumber || "NEW VEHICLE"}

    selectedVehicle={selectedVehicle}

    selectedBrand={selectedBrand}

    selectedModel={selectedModel}

    selectedVariant={selectedVariant}

    selectedFuel={selectedFuel}

    selectedYear={selectedYear}

    selectedLocation={selectedLocation}
rcDetails={rcDetails}
    onUpdateData={(data) => {

      if(data.vehicle)
        setSelectedVehicle(data.vehicle);

      if(data.brand)
        setSelectedBrand(data.brand);

      if(data.model)
        setSelectedModel(data.model);

      if(data.variant)
        setSelectedVariant(data.variant);

      if(data.fuel)
        setSelectedFuel(data.fuel);

    }}


    oncommercialvehicle1={() =>
      setStep("chooseLocation")
    }

    onChooseVehicle={() =>
      setStep("chooseBrand")
    }

    onChooseBrand={() =>
      setStep("chooseModel")
    }

    onChooseModel={() =>
      setStep("selectfueltype")
    }

    onChooseFuelVariant={() =>
      setStep("chooseVariant")
    }

    onChooseYear={() =>
      setStep("chooseYear")
    }

  />
)}
    </div>
  );
}

export default Carinsurance;
