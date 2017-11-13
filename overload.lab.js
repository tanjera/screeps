StructureLab.prototype.canBoost = function canBoost(mineral) {
    return this.energy > 20 && this.mineralAmount > 30 
            && (mineral == null || mineral == this.mineralType);
}