import openpyxl
import json
import datetime
import re

file_path = "D:/IA/Google Apps/Vocali/Vocali-Manager/migration-data/base_vocali.xlsx"

def clean_str(val):
    if val is None:
        return ""
    # Remove leading/trailing whitespaces and non-breaking spaces
    return str(val).strip().replace("\xa0", " ").replace("\n", " ")

def clean_matricula(val):
    val = clean_str(val).upper().replace(" ", "")
    # Replace O with 0 only if it looks like VO...
    if val.startswith("VO"):
        val = "V0" + val[2:]
    return val

def excel_to_date_str(val):
    if val is None:
        return None
    if isinstance(val, datetime.datetime):
        return val.isoformat()
    if isinstance(val, datetime.date):
        return val.isoformat()
    
    # Try parsing float Excel serial number
    try:
        f_val = float(val)
        # Excel date starting epoch is 1899-12-30
        base_date = datetime.datetime(1899, 12, 30)
        actual_date = base_date + datetime.timedelta(days=f_val)
        return actual_date.isoformat()
    except ValueError:
        pass
        
    s_val = clean_str(val).upper()
    if not s_val or s_val in ["-", "N/A", "SIN CONFIRMAR", "UN AÑO"]:
        return None
        
    # Try to parse some common strings
    # e.g., "9 AGOST 25" -> "2025-08-09"
    # or "16/SEP/25" -> "2025-09-16"
    months_es = {
        "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
        "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12
    }
    
    # e.g., 9 AGOST 25
    m = re.match(r"(\d+)\s+([A-Z]{3,5})\s+(\d+)", s_val)
    if m:
        d = int(m.group(1))
        mon_str = m.group(2)[:3]
        y = int(m.group(3))
        if y < 100:
            y += 2000
        mon = months_es.get(mon_str, 1)
        return datetime.date(y, mon, d).isoformat()
        
    # e.g. 16/SEP/25
    m = re.match(r"(\d+)/([A-Z]{3,5})/(\d+)", s_val)
    if m:
        d = int(m.group(1))
        mon_str = m.group(2)[:3]
        y = int(m.group(3))
        if y < 100:
            y += 2000
        mon = months_es.get(mon_str, 1)
        return datetime.date(y, mon, d).isoformat()

    return None

def clean_phone(val):
    val = clean_str(val)
    # Extract digits
    digits = "".join(c for c in val if c.isdigit())
    if len(digits) >= 10:
        return digits
    return val if val else None

def normalize_status(val):
    s = clean_str(val).upper()
    if not s:
        return "NUEVO"
    if "INSCRIT" in s or "YA PAGO" in s or "YA PAGÓ" in s or "INICIO CLAASE" in s:
        return "INSCRITO"
    if "DEJÓ DE" in s or "DEJO DE" in s or "NO RESPONDE" in s or "LE QUEDA LEJOS" in s or "AGRADECE INF" in s:
        return "NO_INTERESADO"
    if "CLASE MUESTRA" in s or "POR AGENDAR" in s or "POR PAGAR CLASE" in s:
        return "CLASE_MUESTRA"
    if "LISTA DE ESPERA" in s:
        return "LISTA_ESPERA"
    return "CONTACTADO"

def normalize_language(val):
    s = clean_str(val).upper()
    if not s:
        return "Inglés"
    if "CHINO" in s:
        return "Chino"
    if "INGLES" in s or "INGLÉS" in s or "BOSTON" in s or "MICHIGAN" in s:
        return "Inglés"
    if "FRANCES" in s or "FRANCÉS" in s:
        return "Francés"
    if "ALEMAN" in s or "ALEMÁN" in s:
        return "Alemán"
    if "ITALIANO" in s:
        return "Italiano"
    if "RUSO" in s:
        return "Ruso"
    if "JAPONES" in s:
        return "Japonés"
    if "PORTUGUES" in s or "PORTUGUÉS" in s:
        return "Portugués"
    return "Inglés"

def clean_name(val):
    s = clean_str(val)
    # Remove excessive spaces
    s = " ".join(s.split())
    return s

def clean_teacher_name(val):
    s = clean_str(val).upper().strip()
    if not s or s == "-":
        return "ADELA"
    # Mapping to standard names
    if "ADELA" in s:
        return "ADELA"
    if "JOSHUA" in s:
        return "JOSHUA"
    if "CALLUM" in s:
        return "CALLUM"
    if "BRENDA" in s:
        return "BRENDA"
    if "RUDI" in s:
        return "RUDI"
    if "RAMSES" in s:
        return "RAMSES"
    if "OSWALDO" in s:
        return "OSWALDO"
    return s

try:
    wb = openpyxl.load_workbook(file_path, data_only=True)
    print("Excel loaded successfully. Analyzing...")
    
    # ----------------------------------------------------
    # 1. PARSE PROSPECTOS
    # ----------------------------------------------------
    prospects_json = []
    sheet_prospectos = wb['PROSPECTOS']
    rows_p = list(sheet_prospectos.iter_rows(values_only=True))
    for r_idx in range(1, len(rows_p)):
        row = rows_p[r_idx]
        if not row or all(c is None for c in row):
            continue
        mat = clean_matricula(row[0])
        name = clean_name(row[1])
        if not name:
            continue
        
        language = normalize_language(row[2])
        level = clean_str(row[3])
        age = clean_str(row[4])
        phone = clean_phone(row[5])
        contact_method = clean_str(row[6])
        lead_date = excel_to_date_str(row[7])
        sample_class = excel_to_date_str(row[8])
        status = normalize_status(row[9])
        
        notes = clean_str(row[10])
        if row[9] and clean_str(row[9]) != status:
            # Append original status comments to notes
            notes = f"{clean_str(row[9])}. {notes}"
            
        prospects_json.append({
            "matricula": mat if mat else None,
            "name": name,
            "language": language,
            "level": level if level else "A1",
            "age": age if age else None,
            "phone": phone,
            "contactMethod": contact_method if contact_method else "Whatsapp",
            "leadDate": lead_date,
            "sampleClassDate": sample_class,
            "status": status,
            "notes": notes if notes else None
        })
    print(f"Parsed {len(prospects_json)} prospects.")

    # Get a mapping of matricula -> phone/email from prospects
    student_contacts = {}
    for p in prospects_json:
        if p["matricula"]:
            student_contacts[p["matricula"]] = {
                "phone": p["phone"],
                "notes": p["notes"]
            }

    # ----------------------------------------------------
    # 2. PARSE STUDENTS (Combining ALUMNOS HORARIOS and Hoja 17)
    # ----------------------------------------------------
    students_dict = {}
    
    # helper to add student
    def add_student_info(row, is_hoja17=False):
        if not row:
            return
        mat = clean_matricula(row[1])
        name = clean_name(row[2])
        if not mat or not name:
            return
            
        level = clean_str(row[3])
        group_id = clean_str(row[4])
        idioma = normalize_language(row[5])
        group_name = clean_str(row[6])
        horario = clean_str(row[10])
        prof = clean_teacher_name(row[11])
        first_pay = excel_to_date_str(row[12])
        pay_method = clean_str(row[13])
        
        # Determine grade (1 to 7) based on level
        grade_val = 1
        if "A1" in level or "Inicial" in level:
            grade_val = 1
        elif "A2" in level:
            grade_val = 2
        elif "B1" in level:
            grade_val = 3
        elif "B2" in level:
            grade_val = 4
        elif "C1" in level:
            grade_val = 5
        elif "C2" in level:
            grade_val = 6
        else:
            # check if it is a number
            match = re.search(r"\d", level)
            if match:
                grade_val = int(match.group(0))
        
        # Determine classId
        class_id = group_name if group_name else (group_id if group_id else "1A")
        if class_id.endswith(".0"):
            class_id = class_id[:-2]
        if not class_id or class_id == "-":
            class_id = "1A"
            
        # Get contact info
        contact = student_contacts.get(mat, {"phone": None, "notes": None})
        
        students_dict[mat] = {
            "id": mat,
            "name": name,
            "email": f"{mat.lower()}@vocali.com",
            "phone": contact["phone"] if contact["phone"] else "2220000000",
            "address": "Calle 25 Norte, San Matías, Pue.",
            "grade": grade_val,
            "classId": class_id,
            "language": idioma,
            "teacher": prof
        }

    # Read ALUMNOS HORARIOS
    rows_a = list(wb['ALUMNOS HORARIOS '].iter_rows(values_only=True))
    for row in rows_a[1:]:
        add_student_info(row)
        
    # Read Hoja 17
    rows_h17 = list(wb['Hoja 17'].iter_rows(values_only=True))
    for row in rows_h17[1:]:
        add_student_info(row, is_hoja17=True)
        
    # Also check if there are students in PAGOS sheet that we missed
    rows_pagos = list(wb['PAGOS '].iter_rows(values_only=True))
    for row in rows_pagos[3:]:
        if not row:
            continue
        mat = clean_matricula(row[0])
        name = clean_name(row[1])
        if not mat or not name:
            continue
        if mat not in students_dict:
            # A student only in PAGOS sheet
            contact_phone = clean_phone(row[3])
            group_name = clean_str(row[2])
            class_id = group_name if group_name else "1A"
            if class_id.endswith(".0"):
                class_id = class_id[:-2]
            if not class_id or class_id == "-":
                class_id = "1A"
                
            students_dict[mat] = {
                "id": mat,
                "name": name,
                "email": f"{mat.lower()}@vocali.com",
                "phone": contact_phone if contact_phone else "2220000000",
                "address": "Calle 25 Norte, San Matías, Pue.",
                "grade": 1,
                "classId": class_id,
                "language": "Inglés",
                "teacher": "ADELA"
            }

    students_json = list(students_dict.values())
    print(f"Parsed {len(students_json)} students.")

    # ----------------------------------------------------
    # 3. PARSE GROUPS & SUBJECTS & TEACHERS
    # ----------------------------------------------------
    teachers_set = set(["ADELA", "JOSHUA", "CALLUM", "BRENDA", "RUDI", "RAMSES", "OSWALDO"])
    subjects_set = set(["Inglés", "Chino", "Francés", "Alemán", "Italiano", "Ruso", "Japonés", "Portugués"])
    
    # Collect extra teachers/subjects from student list
    for s in students_json:
        teachers_set.add(s["teacher"])
        subjects_set.add(s["language"])
        
    teachers_json = [{"id": f"T{idx:03d}", "name": name} for idx, name in enumerate(sorted(list(teachers_set)), start=1)]
    teacher_name_to_id = {t["name"]: t["id"] for t in teachers_json}
    
    subjects_json = [{"id": idx, "name": name} for idx, name in enumerate(sorted(list(subjects_set)), start=1)]
    
    # Parse Groups
    groups_dict = {}
    sheet_grupos = wb['GRUPOS HORARIOS ']
    rows_g = list(sheet_grupos.iter_rows(values_only=True))
    for r_idx in range(1, len(rows_g)):
        row = rows_g[r_idx]
        if not row or all(c is None for c in row):
            continue
        g_name = clean_name(row[0])
        g_lang = normalize_language(row[1])
        g_prof = clean_teacher_name(row[2])
        g_level = clean_str(row[3])
        g_id = clean_str(row[4])
        
        if not g_name:
            continue
            
        class_id = g_name
        if class_id.endswith(".0"):
            class_id = class_id[:-2]
            
        teacher_id = teacher_name_to_id.get(g_prof, teacher_name_to_id["ADELA"])
        
        groups_dict[class_id] = {
            "id": class_id,
            "name": class_id,
            "capacity": 10,
            "grade": 1,
            "supervisorId": teacher_id
        }
        
    # Also add groups referenced by students that are not in GRUPOS HORARIOS
    for s in students_json:
        c_id = s["classId"]
        if c_id not in groups_dict:
            t_id = teacher_name_to_id.get(s["teacher"], teacher_name_to_id["ADELA"])
            groups_dict[c_id] = {
                "id": c_id,
                "name": c_id,
                "capacity": 15,
                "grade": s["grade"],
                "supervisorId": t_id
            }
            
    groups_json = list(groups_dict.values())
    print(f"Parsed {len(groups_json)} groups.")

    # ----------------------------------------------------
    # 4. PARSE PAYMENTS
    # ----------------------------------------------------
    payments_json = []
    
    # The repeating column patterns in PAGOS
    # We found ESTATUS columns at: 5, 9, 12, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53
    # Let's map these ESTATUS columns and look for adjacent values to form a payment block
    estatus_indices = [5, 9, 12, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53]
    
    for r_idx in range(3, len(rows_pagos)):
        row = rows_pagos[r_idx]
        if not row or all(c is None for c in row):
            continue
        mat = clean_matricula(row[0])
        name = clean_name(row[1])
        if not mat or not name:
            continue
            
        # Parse each block
        for b_idx, est_idx in enumerate(estatus_indices):
            # Check if status has a value
            status_val = clean_str(row[est_idx]).upper()
            if not status_val or status_val == "-":
                continue
                
            # Determine normalized status: Pagado, Pendiente, Atrasado
            status = "Pagado"
            if "PENDIENTE" in status_val or "POR PAGAR" in status_val:
                status = "Pendiente"
            elif "ATRASADO" in status_val:
                status = "Atrasado"
                
            # Default values
            amount = 1200.0
            hours = 0
            payment_date = None
            due_date = None
            
            # Map values based on block type
            if est_idx == 5:
                # Block 1 (Cols 4-8): Date(4), Estatus(5), Hours(6), Monto(7), DueDate(8)
                payment_date = excel_to_date_str(row[4])
                try: hours = int(float(row[6])) if row[6] is not None else 0
                except: pass
                try: amount = float(row[7]) if row[7] is not None else 1200.0
                except: pass
                due_date = excel_to_date_str(row[8])
            elif est_idx == 9:
                # Block 2 (Cols 9-11): Estatus(9), Monto(10), DueDate(11)
                try: amount = float(row[10]) if row[10] is not None else 1200.0
                except: pass
                due_date = excel_to_date_str(row[11])
            elif est_idx == 12:
                # Block 3 (Cols 12-14): Estatus(12), Hours(13), Date(14)
                try: hours = int(float(row[13])) if row[13] is not None else 0
                except: pass
                payment_date = excel_to_date_str(row[14])
            elif est_idx == 15:
                # Block 4 (Cols 15-16): Estatus(15), Date(16)
                payment_date = excel_to_date_str(row[16])
            elif est_idx == 17:
                # Block 5 (Cols 17-18): Estatus(17), DueDate(18)
                due_date = excel_to_date_str(row[18])
            elif est_idx == 19:
                # Block 6 (Cols 19-20): Estatus(19), Date(20)
                payment_date = excel_to_date_str(row[20])
            elif est_idx == 21:
                # Block 7 (Cols 21-22): Estatus(21), DueDate(22)
                due_date = excel_to_date_str(row[22])
            elif est_idx == 23:
                # Block 8 (Cols 23-24): Estatus(23), Date(24)
                payment_date = excel_to_date_str(row[24])
            elif est_idx == 25:
                # Block 9 (Cols 25-26): Estatus(25), DueDate(26)
                due_date = excel_to_date_str(row[26])
            elif est_idx == 27:
                # Block 10 (Cols 27-28): Estatus(27), Date(28)
                payment_date = excel_to_date_str(row[28])
            elif est_idx == 29:
                # Block 11 (Cols 29-30): Estatus(29), DueDate(30)
                due_date = excel_to_date_str(row[30])
            elif est_idx == 31:
                # Block 12 (Cols 31-32): Estatus(31), Date(32)
                payment_date = excel_to_date_str(row[32])
            elif est_idx == 33:
                # Block 13 (Cols 33-34): Estatus(33), DueDate(34)
                due_date = excel_to_date_str(row[34])
            elif est_idx == 35:
                # Block 14 (Cols 35-36): Estatus(35), DueDate(36)
                due_date = excel_to_date_str(row[36])
            elif est_idx == 37:
                # Block 15 (Cols 37-38): Estatus(37), DueDate(38)
                due_date = excel_to_date_str(row[38])
            elif est_idx == 39:
                # Block 16 (Cols 39-40): Estatus(39), DueDate(40)
                due_date = excel_to_date_str(row[40])
            elif est_idx == 41:
                # Block 17 (Cols 41-42): Estatus(41), DueDate(42)
                due_date = excel_to_date_str(row[42])
            elif est_idx == 43:
                # Block 18 (Cols 43-44): Estatus(43), DueDate(44)
                due_date = excel_to_date_str(row[44])
            elif est_idx == 45:
                # Block 19 (Cols 45-46): Estatus(45), DueDate(46)
                due_date = excel_to_date_str(row[46])
            elif est_idx == 47:
                # Block 20 (Cols 47-48): Estatus(47), DueDate(48)
                due_date = excel_to_date_str(row[48])
            elif est_idx == 49:
                # Block 21 (Cols 49-50): Estatus(49), DueDate(50)
                due_date = excel_to_date_str(row[50])
            elif est_idx == 51:
                # Block 22 (Cols 51-52): Estatus(51), DueDate(52)
                due_date = excel_to_date_str(row[52])
            elif est_idx == 53:
                # Block 23 (Cols 53): Estatus(53)
                pass

            # If we don't have due_date but have payment_date, set due_date = payment_date + 1 month
            if not due_date and payment_date:
                try:
                    p_dt = datetime.datetime.fromisoformat(payment_date)
                    d_dt = p_dt + datetime.timedelta(days=30)
                    due_date = d_dt.isoformat()
                except:
                    pass
            # If we don't have payment_date but status is Pagado and we have due_date, set payment_date = due_date - 1 month
            if not payment_date and status == "Pagado" and due_date:
                try:
                    d_dt = datetime.datetime.fromisoformat(due_date)
                    p_dt = d_dt - datetime.timedelta(days=30)
                    payment_date = p_dt.isoformat()
                except:
                    pass
                    
            if not due_date:
                due_date = datetime.date.today().isoformat()
                
            payments_json.append({
                "studentId": mat,
                "amount": amount,
                "hours": hours if hours > 0 else (8 if amount > 1000 else 0),
                "type": "Por horas" if hours > 0 else "Mensual",
                "status": status,
                "dueDate": due_date,
                "paymentDate": payment_date,
                "method": "Transferencia" if "transferencia" in clean_str(row[13]).lower() else "Efectivo"
            })

    print(f"Parsed {len(payments_json)} payments.")

    # ----------------------------------------------------
    # 5. WRITE JSON OUTS
    # ----------------------------------------------------
    with open("D:/IA/Google Apps/Vocali/Vocali-Manager/migration-data/leads.json", "w", encoding="utf-8") as f:
        json.dump(prospects_json, f, ensure_ascii=False, indent=2)
    with open("D:/IA/Google Apps/Vocali/Vocali-Manager/migration-data/students.json", "w", encoding="utf-8") as f:
        json.dump(students_json, f, ensure_ascii=False, indent=2)
    with open("D:/IA/Google Apps/Vocali/Vocali-Manager/migration-data/teachers.json", "w", encoding="utf-8") as f:
        json.dump(teachers_json, f, ensure_ascii=False, indent=2)
    with open("D:/IA/Google Apps/Vocali/Vocali-Manager/migration-data/subjects.json", "w", encoding="utf-8") as f:
        json.dump(subjects_json, f, ensure_ascii=False, indent=2)
    with open("D:/IA/Google Apps/Vocali/Vocali-Manager/migration-data/groups.json", "w", encoding="utf-8") as f:
        json.dump(groups_json, f, ensure_ascii=False, indent=2)
    with open("D:/IA/Google Apps/Vocali/Vocali-Manager/migration-data/payments.json", "w", encoding="utf-8") as f:
        json.dump(payments_json, f, ensure_ascii=False, indent=2)

    print("\nAll JSON files written successfully to migration-data/!")

except Exception as e:
    import traceback
    print("Error during extraction:")
    traceback.print_exc()
