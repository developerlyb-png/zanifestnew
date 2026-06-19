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

"/api/zuno/4w/vahan-check",

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
"ZUNO VAHAN RESULT",
result
);




// ======================
// SUCCESS AUTO FILL
// ======================

if(result.success){



const data =

result.data?.data ||

result.data;



console.log(
"ZUNO VEHICLE DATA",
data
);




setSelectedBrand(

data?.make ||

data?.maker ||

data?.manufacturer ||

""

);



setSelectedModel(

data?.model ||

data?.vehicleModel ||

""

);



setSelectedFuel(

data?.fuelType ||

data?.fuel ||

""

);



setSelectedVariant(

data?.variant ||

data?.vehicleVariant ||

""

);



setSelectedYear(

Number(

data?.manufacturingYear ||

data?.manufactureYear ||

data?.year ||

new Date().getFullYear()

)

);




setSelectedLocation({

state:

data?.state ||

"",


rto:

data?.rto ||

data?.registrationAuthority ||

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
