"use client";

import {
createContext,
useContext,
useEffect,
useState,
ReactNode
} from "react";

import { useRouter } from "next/router";


interface User {

name:string;
email:string;
role?:"user"|"admin";
loginTime?:number;

}


interface AuthContextType {

user:User | null;
isLoggedIn:boolean;
loading:boolean;
isAdmin:boolean;
logout:()=>void;
setUser:(u:User|null)=>void;

}


const AuthContext =
createContext<AuthContextType | undefined>(
undefined
);



export const AuthProvider =
({children}:{children:ReactNode})=>{


const [user,setUser] =
useState<User|null>(null);


const [loading,setLoading] =
useState(true);


const router =
useRouter();



useEffect(()=>{


const loadUser =
async()=>{


const localUser =
localStorage.getItem("user");


// OTP LOGIN

if(localUser){


const parsed =
JSON.parse(localUser);



if(
parsed.loginTime &&
Date.now()-parsed.loginTime >
60*60*1000
){


localStorage.removeItem("user");

setUser(null);

setLoading(false);

router.push("/login");

return;

}


// The OTP flows (car/health/bike/CV purchase dialogs) also set a real
// userToken cookie at login time — confirm it's still valid server-side
// before trusting this localStorage entry. Without this, the Navbar can
// keep showing "logged in" (and a working Dashboard link) long after the
// cookie backing it has expired or was never stored, and clicking through
// bounces the user straight back to /login.
try{

const meRes =
await fetch(
"/api/users/me",
{credentials:"include"}
);

if(!meRes.ok){

localStorage.removeItem("user");

setUser(null);

setLoading(false);

return;

}

}
catch(err){

localStorage.removeItem("user");

setUser(null);

setLoading(false);

return;

}


setUser({

name:parsed.name,

email:parsed.email,

role:"user",

loginTime:parsed.loginTime

});


setLoading(false);


return;


}




// NORMAL LOGIN

try{


const userRes =
await fetch(
"/api/users/me",
{
credentials:"include"
}
);



if(userRes.ok){


const d =
await userRes.json();


setUser({

name:d.name,

email:d.email,

role:"user"

});


}
else{


const adminRes =
await fetch(
"/api/admin/me",
{
credentials:"include"
}
);



if(adminRes.ok){


const d =
await adminRes.json();


setUser({

name:d.name || "Admin",

email:d.email,

role:"admin"

});


}
else{


setUser(null);


}


}


}
catch(err){


setUser(null);


}
finally{


setLoading(false);


}



};



loadUser();


// OTP VERIFY EVENT

window.addEventListener(
"userLogin",
loadUser
);



// AUTO LOGOUT TIMER

const interval =
setInterval(
loadUser,
60000
);



return()=>{


window.removeEventListener(
"userLogin",
loadUser
);


clearInterval(interval);


};



},[]);





const logout =
async()=>{


try{


await fetch(
"/api/users/logout",
{
method:"POST"
}
);



await fetch(
"/api/admin/logout",
{
method:"POST"
}
);



}
finally{


localStorage.removeItem("user");


setUser(null);


router.push("/login");


}


};




return(

<AuthContext.Provider

value={{

user,

isLoggedIn:!!user,

isAdmin:user?.role==="admin",

loading,

logout,

setUser

}}

>

{children}

</AuthContext.Provider>

);


};



export const useAuth=()=>{


const context =
useContext(AuthContext);


if(!context){

throw new Error(
"useAuth must be used within an AuthProvider"
);

}


return context;


};