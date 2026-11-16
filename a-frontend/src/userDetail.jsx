import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./userDetail.css";


function UserDetail(){

const {id}=useParams();

const [user,setUser]=useState(null);


useEffect(()=>{

fetch(
`http://localhost:8000/api/users/${id}`,
{
headers:{
Authorization:
"Bearer "+localStorage.getItem("token"),
Accept:"application/json"
}
}
)
.then(res=>res.json())
.then(data=>{

setUser(data.data);

});


},[id]);



if(!user){

return <p>Loading...</p>

}


return(

<div className="user-page">

<div className="user-card">


<h4>
Detail User
</h4>


<hr/>


<div>

<b>Nama</b>
<p>{user.name}</p>

</div>


<div>

<b>NIK</b>
<p>{user.nik}</p>

</div>


<div>

<b>Email</b>
<p>{user.email}</p>

</div>


<div>

<b>Department</b>
<p>{user.department}</p>

</div>


<div>

<b>Position</b>
<p>{user.position}</p>

</div>


<div>

<b>Role</b>
<p>{user.role?.name}</p>

</div>


</div>

</div>


)

}


export default UserDetail;