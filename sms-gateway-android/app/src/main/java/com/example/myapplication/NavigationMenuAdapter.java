package com.example.myapplication;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class NavigationMenuAdapter extends RecyclerView.Adapter<NavigationMenuAdapter.ViewHolder> {
    private List<NavigationMenuItem> menuItems;
    private OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(int position);
    }

    public NavigationMenuAdapter(List<NavigationMenuItem> menuItems, OnItemClickListener listener) {
        this.menuItems = menuItems;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_navigation_menu, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        NavigationMenuItem item = menuItems.get(position);
        
        if (item.getType() == 1) { // Header
            holder.imageViewIcon.setVisibility(View.GONE);
            holder.imageViewArrow.setVisibility(View.GONE);
            holder.textViewTitle.setTextSize(18);
            holder.textViewTitle.setTextColor(androidx.core.content.ContextCompat.getColor(holder.itemView.getContext(), R.color.primary_blue));
        } else if (item.getType() == 2) { // Divider
            holder.imageViewIcon.setVisibility(View.GONE);
            holder.imageViewArrow.setVisibility(View.GONE);
            holder.textViewTitle.setText("");
            holder.itemView.setBackgroundColor(androidx.core.content.ContextCompat.getColor(holder.itemView.getContext(), R.color.divider));
            holder.itemView.setPadding(0, 8, 0, 8);
        } else { // Normal item
            holder.imageViewIcon.setVisibility(View.VISIBLE);
            holder.imageViewIcon.setImageResource(item.getIcon());
            holder.textViewTitle.setTextSize(16);
            holder.textViewTitle.setTextColor(androidx.core.content.ContextCompat.getColor(holder.itemView.getContext(), R.color.text_primary));
            holder.imageViewArrow.setVisibility(item.isHasArrow() ? View.VISIBLE : View.GONE);
        }
        
        holder.textViewTitle.setText(item.getTitle());
        
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onItemClick(position);
            }
        });
    }

    @Override
    public int getItemCount() {
        return menuItems.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView imageViewIcon;
        TextView textViewTitle;
        ImageView imageViewArrow;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            imageViewIcon = itemView.findViewById(R.id.imageViewIcon);
            textViewTitle = itemView.findViewById(R.id.textViewTitle);
            imageViewArrow = itemView.findViewById(R.id.imageViewArrow);
        }
    }
}
