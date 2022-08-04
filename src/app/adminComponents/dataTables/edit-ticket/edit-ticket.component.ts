import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface employee {
  name: string;
  id: string;
}

interface valVar {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-edit-ticket',
  templateUrl: './edit-ticket.component.html',
  styleUrls: ['./edit-ticket.component.css']
})
export class EditTicketComponent implements OnInit {
  carName: string = '';
  date: string = '';
  employeeID: string = '';
  fuelType: string = '';
  mechanicName?: string = '';
  price: number = 0;
  problem: string = '';
  solution: string = '';
  status: string = '';
  transmission: string = '';
  ticketID: string = '';
  time: string = '';

  form: FormGroup;
  employees: employee[] = [];
  statusArray: valVar[] = [
    { value: "Pending Inquiry", viewValue: 'Pending Inquiry'},
    { value: "Pending Diagnosis", viewValue: 'Pending Diagnosis'},
    { value: "Undergoing Diagnosis", viewValue: 'Undergoing Diagnosis' },
    { value: "Undergoing Repair/Maintenance", viewValue: 'Undergoing Repair/Maintenance' },
    { value: "Pending Payment", viewValue: 'Pending Payment'},
    { value: "For Release", viewValue: 'For Release'}
  ];
  
  constructor(private afs: AngularFirestore,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditTicketComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {
    
    this.ticketID = data.ticketID;
    this.carName = data.carName;
    this.date = data.date;
    this.time = data.time;
    this.employeeID = data.employeeID;
    this.fuelType = data.fuelType;
    this.mechanicName = data.mechanicName;
    this.price = data.price;
    this.problem = data.problem;
    this.solution = data.solution;
    this.status = data.status;
    this.transmission = data.transmission;

    this.afs.collection<any>('users').valueChanges().subscribe(result => {
      result.forEach(doc =>{
        if(doc.permission == 1) {
          let obj = { name: doc.fullName, id: doc.uid};
          this.employees.push(obj);
        }
      });
      
    })

    this.form = this.fb.group({
      employeeID: [this.employeeID]
    });
  }

  ngOnInit(): void {
  }

  test() {
    let selection = this.employees.find(data => data.id == this.employeeID);
    this.mechanicName = selection?.name;
    let seeStatus = this.statusArray.find(data => data.value == this.status);
    console.log(seeStatus)
  }
  updateData(): void {
    let selection = this.employees.find(data => data.id == this.employeeID);
    this.mechanicName = selection?.name;
    this.afs.collection('tickets').doc(this.ticketID).update({
      carName: this.carName,
      date: this.date,
      time: this.time,
      employeeID: this.employeeID,
      fuelType: this.fuelType,
      mechanicName: this.mechanicName,
      price: this.price,
      problem: this.problem,
      solution: this.solution,
      status: this.status,
      transmission: this.transmission
    })
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }

}