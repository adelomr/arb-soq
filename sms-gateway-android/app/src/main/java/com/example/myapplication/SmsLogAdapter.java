package com.example.myapplication;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class SmsLogAdapter extends RecyclerView.Adapter<SmsLogAdapter.LogViewHolder> {

    private final List<SmsLog> items = new ArrayList<>();

    public SmsLogAdapter(List<SmsLog> initial) {
        if (initial != null) {
            items.addAll(initial);
        }
    }

    public void setItems(List<SmsLog> newItems) {
        items.clear();
        if (newItems != null) items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public LogViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_sms_log, parent, false);
        return new LogViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull LogViewHolder holder, int position) {
        SmsLog log = items.get(position);
        if (log.sim == 0) {
            holder.sim.setText("WhatsApp");
        } else {
            holder.sim.setText("SIM " + log.sim);
        }
        String time = DateFormat.getDateTimeInstance().format(new Date(log.sentAt));
        holder.subtitle.setText("الكود: " + log.code + " • " + time);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class LogViewHolder extends RecyclerView.ViewHolder {
        TextView title;
        TextView subtitle;
        TextView sim;
        LogViewHolder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.textTitle);
            subtitle = itemView.findViewById(R.id.textSubtitle);
            sim = itemView.findViewById(R.id.textSim);
        }
    }
}


