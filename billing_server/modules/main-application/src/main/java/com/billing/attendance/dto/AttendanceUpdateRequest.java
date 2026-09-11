package com.billing.attendance.dto;

import lombok.Data;

@Data
public class AttendanceUpdateRequest {
    private String punchType;
    private String punchDate;
    private String punchTime;
    private String notes;
}
